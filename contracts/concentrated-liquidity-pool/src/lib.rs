#![no_std]
use soroban_sdk::{contract, contractimpl, Address, Env};

mod fee_growth;
mod position;
mod sqrt_price;
mod tick;

use position::PositionInfo;
use sqrt_price::Slot0;

#[contract]
pub struct ConcentratedLiquidityPool;

#[contractimpl]
impl ConcentratedLiquidityPool {
    pub fn initialize(
        env: Env,
        token0: Address,
        token1: Address,
        fee_bps: u32,
        tick_spacing: i32,
        initial_sqrt_price: u128,
    ) -> Result<(), soropool_shared::Error> {
        if sqrt_price::get_slot0(&env).sqrt_price_x96 != 0 {
            return Err(soropool_shared::Error::AlreadyInitialized);
        }
        let initial_tick = sqrt_price::price_to_tick(initial_sqrt_price);
        sqrt_price::set_slot0(&env, &Slot0 {
            sqrt_price_x96: initial_sqrt_price,
            tick: initial_tick,
            liquidity: 0,
        });
        env.storage().persistent().set(&soroban_sdk::symbol_short!("tok0"), &token0);
        env.storage().persistent().set(&soroban_sdk::symbol_short!("tok1"), &token1);
        env.storage().persistent().set(&soroban_sdk::symbol_short!("fee"), &fee_bps);
        env.storage().persistent().set(&soroban_sdk::symbol_short!("tspac"), &tick_spacing);
        Ok(())
    }

    pub fn mint_position(
        env: Env,
        recipient: Address,
        tick_lower: i32,
        tick_upper: i32,
        liquidity_desired: u128,
        amount0_max: i128,
        amount1_max: i128,
        deadline: u64,
    ) -> Result<(u128, i128, i128), soropool_shared::Error> {
        if env.ledger().timestamp() > deadline {
            return Err(soropool_shared::Error::DeadlineExpired);
        }
        if tick_lower >= tick_upper || liquidity_desired == 0 {
            return Err(soropool_shared::Error::InvalidInput);
        }

        let slot0 = sqrt_price::get_slot0(&env);
        let sqrt_lower = sqrt_price::tick_to_sqrt_price(&env, tick_lower);
        let sqrt_upper = sqrt_price::tick_to_sqrt_price(&env, tick_upper);

        let amount0 = sqrt_price::get_amount0_delta(
            slot0.sqrt_price_x96.max(sqrt_lower),
            sqrt_upper,
            liquidity_desired,
            true,
        );
        let amount1 = sqrt_price::get_amount1_delta(
            sqrt_lower,
            slot0.sqrt_price_x96.min(sqrt_upper),
            liquidity_desired,
            true,
        );

        if amount0 > amount0_max || amount1 > amount1_max {
            return Err(soropool_shared::Error::SlippageExceeded);
        }

        // Transfer tokens from recipient
        let token0: Address = env.storage().persistent().get(&soroban_sdk::symbol_short!("tok0")).unwrap();
        let token1: Address = env.storage().persistent().get(&soroban_sdk::symbol_short!("tok1")).unwrap();
        if amount0 > 0 {
            soroban_sdk::token::TokenClient::new(&env, &token0)
                .transfer(&recipient, &env.current_contract_address(), &amount0);
        }
        if amount1 > 0 {
            soroban_sdk::token::TokenClient::new(&env, &token1)
                .transfer(&recipient, &env.current_contract_address(), &amount1);
        }

        // Update ticks
        tick::flip_tick(&env, tick_lower, liquidity_desired, false);
        tick::flip_tick(&env, tick_upper, liquidity_desired, true);

        // Update active liquidity if position overlaps current tick
        let mut slot0_mut = slot0;
        if slot0_mut.tick >= tick_lower && slot0_mut.tick < tick_upper {
            slot0_mut.liquidity += liquidity_desired;
            sqrt_price::set_slot0(&env, &slot0_mut);
        }

        let position_id = position::next_position_id(&env);
        let pos = PositionInfo {
            liquidity: liquidity_desired,
            fee_growth_inside_0: 0,
            fee_growth_inside_1: 0,
            tokens_owed_0: 0,
            tokens_owed_1: 0,
        };
        position::set_position(&env, position_id, &pos);

        Ok((position_id, amount0, amount1))
    }

    pub fn increase_liquidity(
        env: Env,
        caller: Address,
        position_id: u128,
        liquidity_delta: u128,
        amount0_max: i128,
        amount1_max: i128,
        deadline: u64,
    ) -> Result<(i128, i128), soropool_shared::Error> {
        if env.ledger().timestamp() > deadline {
            return Err(soropool_shared::Error::DeadlineExpired);
        }
        caller.require_auth();
        let mut pos = position::get_position(&env, position_id)
            .ok_or(soropool_shared::Error::InvalidInput)?;
        let slot0 = sqrt_price::get_slot0(&env);

        let sqrt_lower = sqrt_price::tick_to_sqrt_price(&env, -887272);
        let sqrt_upper = sqrt_price::tick_to_sqrt_price(&env, 887272);

        let amount0 = sqrt_price::get_amount0_delta(
            slot0.sqrt_price_x96.max(sqrt_lower),
            sqrt_upper,
            liquidity_delta,
            true,
        );
        let amount1 = sqrt_price::get_amount1_delta(
            sqrt_lower,
            slot0.sqrt_price_x96.min(sqrt_upper),
            liquidity_delta,
            true,
        );

        if amount0 > amount0_max || amount1 > amount1_max {
            return Err(soropool_shared::Error::SlippageExceeded);
        }

        let token0: Address = env.storage().persistent().get(&soroban_sdk::symbol_short!("tok0")).unwrap();
        let token1: Address = env.storage().persistent().get(&soroban_sdk::symbol_short!("tok1")).unwrap();
        if amount0 > 0 {
            soroban_sdk::token::TokenClient::new(&env, &token0)
                .transfer(&caller, &env.current_contract_address(), &amount0);
        }
        if amount1 > 0 {
            soroban_sdk::token::TokenClient::new(&env, &token1)
                .transfer(&caller, &env.current_contract_address(), &amount1);
        }

        pos.liquidity += liquidity_delta;
        position::set_position(&env, position_id, &pos);

        let mut slot0_mut = slot0;
        slot0_mut.liquidity += liquidity_delta;
        sqrt_price::set_slot0(&env, &slot0_mut);

        Ok((amount0, amount1))
    }

    pub fn decrease_liquidity(
        env: Env,
        caller: Address,
        position_id: u128,
        liquidity_delta: u128,
        amount0_min: i128,
        amount1_min: i128,
        deadline: u64,
    ) -> Result<(i128, i128), soropool_shared::Error> {
        if env.ledger().timestamp() > deadline {
            return Err(soropool_shared::Error::DeadlineExpired);
        }
        caller.require_auth();
        let mut pos = position::get_position(&env, position_id)
            .ok_or(soropool_shared::Error::InvalidInput)?;
        if pos.liquidity < liquidity_delta {
            return Err(soropool_shared::Error::InsufficientLiquidity);
        }

        let slot0 = sqrt_price::get_slot0(&env);
        let sqrt_lower = sqrt_price::tick_to_sqrt_price(&env, -887272);
        let sqrt_upper = sqrt_price::tick_to_sqrt_price(&env, 887272);

        let amount0 = sqrt_price::get_amount0_delta(
            slot0.sqrt_price_x96.max(sqrt_lower),
            sqrt_upper,
            liquidity_delta,
            false,
        );
        let amount1 = sqrt_price::get_amount1_delta(
            sqrt_lower,
            slot0.sqrt_price_x96.min(sqrt_upper),
            liquidity_delta,
            false,
        );

        if amount0 < amount0_min || amount1 < amount1_min {
            return Err(soropool_shared::Error::SlippageExceeded);
        }

        pos.liquidity -= liquidity_delta;
        pos.tokens_owed_0 += amount0;
        pos.tokens_owed_1 += amount1;
        position::set_position(&env, position_id, &pos);

        let mut slot0_mut = slot0;
        slot0_mut.liquidity = slot0_mut.liquidity.saturating_sub(liquidity_delta);
        sqrt_price::set_slot0(&env, &slot0_mut);

        Ok((amount0, amount1))
    }

    pub fn collect_fees(
        env: Env,
        caller: Address,
        position_id: u128,
        amount0_max: i128,
        amount1_max: i128,
    ) -> Result<(i128, i128), soropool_shared::Error> {
        caller.require_auth();
        let mut pos = position::get_position(&env, position_id)
            .ok_or(soropool_shared::Error::InvalidInput)?;

        let collect0 = pos.tokens_owed_0.min(amount0_max);
        let collect1 = pos.tokens_owed_1.min(amount1_max);

        pos.tokens_owed_0 -= collect0;
        pos.tokens_owed_1 -= collect1;
        position::set_position(&env, position_id, &pos);

        let token0: Address = env.storage().persistent().get(&soroban_sdk::symbol_short!("tok0")).unwrap();
        let token1: Address = env.storage().persistent().get(&soroban_sdk::symbol_short!("tok1")).unwrap();
        if collect0 > 0 {
            soroban_sdk::token::TokenClient::new(&env, &token0)
                .transfer(&env.current_contract_address(), &caller, &collect0);
        }
        if collect1 > 0 {
            soroban_sdk::token::TokenClient::new(&env, &token1)
                .transfer(&env.current_contract_address(), &caller, &collect1);
        }

        Ok((collect0, collect1))
    }

    /// Single-tick-range swap (simplified: no multi-tick crossing).
    pub fn swap(
        env: Env,
        caller: Address,
        zero_for_one: bool,
        amount_specified: i128,
        sqrt_price_limit: u128,
        recipient: Address,
        deadline: u64,
    ) -> Result<(i128, i128), soropool_shared::Error> {
        if env.ledger().timestamp() > deadline {
            return Err(soropool_shared::Error::DeadlineExpired);
        }
        caller.require_auth();
        if amount_specified == 0 {
            return Err(soropool_shared::Error::InvalidInput);
        }

        let mut slot0 = sqrt_price::get_slot0(&env);
        let fee_bps: u32 = env.storage().persistent().get(&soroban_sdk::symbol_short!("fee")).unwrap_or(30);

        // Exact input swap
        let exact_input = amount_specified > 0;
        let amount_in = if exact_input { amount_specified } else { -amount_specified };

        // Compute next sqrt price
        let next_sqrt_price = sqrt_price::get_next_sqrt_price_from_input(
            slot0.sqrt_price_x96,
            slot0.liquidity,
            amount_in,
            zero_for_one,
        );

        // Enforce price limit
        if zero_for_one && next_sqrt_price < sqrt_price_limit {
            return Err(soropool_shared::Error::SlippageExceeded);
        }
        if !zero_for_one && next_sqrt_price > sqrt_price_limit && sqrt_price_limit != 0 {
            return Err(soropool_shared::Error::SlippageExceeded);
        }

        let (amount0, amount1) = if zero_for_one {
            let a0 = amount_in;
            let a1 = -sqrt_price::get_amount1_delta(next_sqrt_price, slot0.sqrt_price_x96, slot0.liquidity, false);
            (a0, a1)
        } else {
            let a0 = -sqrt_price::get_amount0_delta(slot0.sqrt_price_x96, next_sqrt_price, slot0.liquidity, false);
            let a1 = amount_in;
            (a0, a1)
        };

        // Apply fee
        let fee_amount0 = if amount0 > 0 { amount0 * fee_bps as i128 / 10_000 } else { 0 };
        let fee_amount1 = if amount1 > 0 { amount1 * fee_bps as i128 / 10_000 } else { 0 };

        // Update fee growth
        let fg0: u128 = env.storage().persistent().get(&soroban_sdk::symbol_short!("fg0")).unwrap_or(0);
        let fg1: u128 = env.storage().persistent().get(&soroban_sdk::symbol_short!("fg1")).unwrap_or(0);
        let (new_fg0, new_fg1) = fee_growth::update_fee_growth(fg0, fg1, slot0.liquidity, fee_amount0, fee_amount1);
        env.storage().persistent().set(&soroban_sdk::symbol_short!("fg0"), &new_fg0);
        env.storage().persistent().set(&soroban_sdk::symbol_short!("fg1"), &new_fg1);

        // Transfer tokens
        let token0: Address = env.storage().persistent().get(&soroban_sdk::symbol_short!("tok0")).unwrap();
        let token1: Address = env.storage().persistent().get(&soroban_sdk::symbol_short!("tok1")).unwrap();

        if amount0 > 0 {
            soroban_sdk::token::TokenClient::new(&env, &token0)
                .transfer(&caller, &env.current_contract_address(), &amount0);
        } else if amount0 < 0 {
            soroban_sdk::token::TokenClient::new(&env, &token0)
                .transfer(&env.current_contract_address(), &recipient, &(-amount0));
        }
        if amount1 > 0 {
            soroban_sdk::token::TokenClient::new(&env, &token1)
                .transfer(&caller, &env.current_contract_address(), &amount1);
        } else if amount1 < 0 {
            soroban_sdk::token::TokenClient::new(&env, &token1)
                .transfer(&env.current_contract_address(), &recipient, &(-amount1));
        }

        slot0.sqrt_price_x96 = next_sqrt_price;
        slot0.tick = sqrt_price::price_to_tick(next_sqrt_price);
        sqrt_price::set_slot0(&env, &slot0);

        Ok((amount0, amount1))
    }

    pub fn get_position(env: Env, position_id: u128) -> PositionInfo {
        position::get_position(&env, position_id).unwrap_or(PositionInfo {
            liquidity: 0,
            fee_growth_inside_0: 0,
            fee_growth_inside_1: 0,
            tokens_owed_0: 0,
            tokens_owed_1: 0,
        })
    }

    pub fn get_slot0(env: Env) -> Slot0 {
        sqrt_price::get_slot0(&env)
    }
}
