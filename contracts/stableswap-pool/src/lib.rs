#![no_std]
use soroban_sdk::{contract, contractimpl, Address, Env, Vec};

mod amplification;
mod invariant;
mod storage;

#[contract]
pub struct StableSwapPool;

#[contractimpl]
impl StableSwapPool {
    pub fn initialize(
        env: Env,
        admin: Address,
        tokens: Vec<Address>,
        a: u128,
        fee: u128,
    ) -> Result<(), soropool_shared::Error> {
        if storage::is_initialized(&env) {
            return Err(soropool_shared::Error::AlreadyInitialized);
        }
        if fee > 10_000 {
            return Err(soropool_shared::Error::InvalidFee);
        }
        admin.require_auth();
        storage::set_admin(&env, &admin);
        storage::set_fee(&env, fee);
        storage::set_n_coins(&env, tokens.len() as u32);
        for (i, token) in tokens.iter().enumerate() {
            storage::set_token(&env, i as u32, &token);
            storage::set_balance(&env, i as u32, 0);
        }
        let now = env.ledger().timestamp();
        amplification::set_initial_a(&env, a, now);
        storage::set_initialized(&env);
        Ok(())
    }

    pub fn add_liquidity(
        env: Env,
        provider: Address,
        amounts: Vec<i128>,
        min_mint_amount: i128,
        deadline: u64,
    ) -> Result<i128, soropool_shared::Error> {
        if env.ledger().timestamp() > deadline {
            return Err(soropool_shared::Error::DeadlineExpired);
        }
        provider.require_auth();
        let n = storage::get_n_coins(&env);
        if amounts.len() as u32 != n {
            return Err(soropool_shared::Error::InvalidInput);
        }
        let a = amplification::get_current_a_with_env(&env);
        let mut balances: Vec<i128> = Vec::new(&env);
        for i in 0..n {
            balances.push_back(storage::get_balance(&env, i));
        }
        let xs_before: soroban_sdk::Vec<i128> = balances.clone();
        let xs_slice_before: &[i128] = &[
            xs_before.get(0).unwrap_or(0),
            xs_before.get(1).unwrap_or(0),
        ];
        let d0 = invariant::compute_d(xs_slice_before, a, n);

        for i in 0..n {
            let amt = amounts.get(i).unwrap_or(0);
            if amt < 0 {
                return Err(soropool_shared::Error::InvalidInput);
            }
            let token = storage::get_token(&env, i);
            let token_client = soroban_sdk::token::TokenClient::new(&env, &token);
            token_client.transfer(&provider, &env.current_contract_address(), &amt);
            let new_bal = storage::get_balance(&env, i) + amt;
            storage::set_balance(&env, i, new_bal);
            balances.set(i, new_bal);
        }

        let xs_after: &[i128] = &[
            balances.get(0).unwrap_or(0),
            balances.get(1).unwrap_or(0),
        ];
        let d1 = invariant::compute_d(xs_after, a, n);

        let total_supply = storage::get_lp_supply(&env);
        let mint_amount = if total_supply == 0 {
            d1
        } else {
            (d1 - d0) * total_supply / d0
        };

        if mint_amount < min_mint_amount {
            return Err(soropool_shared::Error::SlippageExceeded);
        }

        let new_supply = total_supply + mint_amount;
        storage::set_lp_supply(&env, new_supply);
        let lp_balance = storage::get_lp_balance(&env, &provider);
        storage::set_lp_balance(&env, &provider, lp_balance + mint_amount);

        Ok(mint_amount)
    }

    pub fn remove_liquidity_one_coin(
        env: Env,
        provider: Address,
        token_amount: i128,
        coin_index: u32,
        min_amount: i128,
    ) -> Result<i128, soropool_shared::Error> {
        provider.require_auth();
        let n = storage::get_n_coins(&env);
        if coin_index >= n {
            return Err(soropool_shared::Error::InvalidInput);
        }
        let lp_balance = storage::get_lp_balance(&env, &provider);
        if lp_balance < token_amount {
            return Err(soropool_shared::Error::InsufficientLiquidity);
        }

        let total_supply = storage::get_lp_supply(&env);
        let a = amplification::get_current_a_with_env(&env);

        // Current balances → D
        let b0 = storage::get_balance(&env, 0);
        let b1 = storage::get_balance(&env, 1);
        let xs: &[i128] = &[b0, b1];
        let d = invariant::compute_d(xs, a, n);

        // New D after LP burn
        let new_d = d * (total_supply - token_amount) / total_supply;

        // Find new balance of coin j
        let mut new_xs = [b0, b1];
        new_xs[coin_index as usize] = invariant::compute_y(xs, a, new_d, coin_index, coin_index);
        let dy = storage::get_balance(&env, coin_index) - new_xs[coin_index as usize] - 1;

        if dy < min_amount {
            return Err(soropool_shared::Error::SlippageExceeded);
        }

        // Update state
        storage::set_lp_balance(&env, &provider, lp_balance - token_amount);
        storage::set_lp_supply(&env, total_supply - token_amount);
        storage::set_balance(&env, coin_index, new_xs[coin_index as usize]);

        let token = storage::get_token(&env, coin_index);
        let token_client = soroban_sdk::token::TokenClient::new(&env, &token);
        token_client.transfer(&env.current_contract_address(), &provider, &dy);

        Ok(dy)
    }

    pub fn exchange(
        env: Env,
        caller: Address,
        i: u32,
        j: u32,
        dx: i128,
        min_dy: i128,
        recipient: Address,
    ) -> Result<i128, soropool_shared::Error> {
        caller.require_auth();
        let n = storage::get_n_coins(&env);
        if i >= n || j >= n || i == j {
            return Err(soropool_shared::Error::InvalidInput);
        }
        if dx <= 0 {
            return Err(soropool_shared::Error::InvalidInput);
        }

        let fee = storage::get_fee(&env);
        let a = amplification::get_current_a_with_env(&env);

        let bi = storage::get_balance(&env, i);
        let bj = storage::get_balance(&env, j);
        let xs: &[i128] = &[bi, bj];
        let d = invariant::compute_d(xs, a, n);

        // Transfer dx from caller
        let token_in = storage::get_token(&env, i);
        let client_in = soroban_sdk::token::TokenClient::new(&env, &token_in);
        client_in.transfer(&caller, &env.current_contract_address(), &dx);

        // New balance of token i
        let mut new_xs = [bi + dx, bj];
        let new_y = invariant::compute_y(&new_xs, a, d, j, i);

        let mut dy = bj - new_y - 1;
        let fee_amount = dy * fee as i128 / 10_000;
        dy -= fee_amount;

        if dy < min_dy {
            return Err(soropool_shared::Error::SlippageExceeded);
        }

        new_xs[j as usize] = new_y;
        storage::set_balance(&env, i, bi + dx);
        storage::set_balance(&env, j, new_y);

        let token_out = storage::get_token(&env, j);
        let client_out = soroban_sdk::token::TokenClient::new(&env, &token_out);
        client_out.transfer(&env.current_contract_address(), &recipient, &dy);

        Ok(dy)
    }

    pub fn get_a(env: Env) -> u128 {
        amplification::get_current_a_with_env(&env)
    }

    pub fn ramp_a(env: Env, future_a: u128, future_time: u64) -> Result<(), soropool_shared::Error> {
        let admin = storage::get_admin(&env);
        amplification::ramp_a_impl(&env, &admin, future_a, future_time)
    }

    pub fn get_d(env: Env) -> u128 {
        let n = storage::get_n_coins(&env);
        let a = amplification::get_current_a_with_env(&env);
        let b0 = storage::get_balance(&env, 0);
        let b1 = storage::get_balance(&env, 1);
        let xs: &[i128] = &[b0, b1];
        invariant::compute_d(xs, a, n) as u128
    }
}
