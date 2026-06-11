use soroban_sdk::{token, Address, Env, IntoVal, Symbol, Val, Vec};

use crate::events;
use crate::math;

pub fn add_liquidity(
    env: &Env,
    provider: &Address,
    amount_a_desired: i128,
    amount_b_desired: i128,
    amount_a_min: i128,
    amount_b_min: i128,
    deadline: u64,
) -> Result<(i128, i128, i128), soropool_shared::Error> {
    let now = env.ledger().timestamp();
    if now > deadline {
        return Err(soropool_shared::Error::DeadlineExpired);
    }

    let reserve_a: i128 = env.storage().instance().get(&crate::RESERVE_A_KEY).unwrap_or(0);
    let reserve_b: i128 = env.storage().instance().get(&crate::RESERVE_B_KEY).unwrap_or(0);

    let (amount_a, amount_b) = if reserve_a == 0 && reserve_b == 0 {
        (amount_a_desired, amount_b_desired)
    } else {
        let amount_b_optimal = amount_a_desired
            .checked_mul(reserve_b)
            .ok_or(soropool_shared::Error::Overflow)?
            .checked_div(reserve_a)
            .ok_or(soropool_shared::Error::Overflow)?;

        if amount_b_optimal <= amount_b_desired {
            if amount_b_optimal < amount_b_min {
                return Err(soropool_shared::Error::SlippageExceeded);
            }
            (amount_a_desired, amount_b_optimal)
        } else {
            let amount_a_optimal = amount_b_desired
                .checked_mul(reserve_a)
                .ok_or(soropool_shared::Error::Overflow)?
                .checked_div(reserve_b)
                .ok_or(soropool_shared::Error::Overflow)?;
            if amount_a_optimal < amount_a_min {
                return Err(soropool_shared::Error::SlippageExceeded);
            }
            (amount_a_optimal, amount_b_desired)
        }
    };

    if amount_a <= 0 || amount_b <= 0 {
        return Err(soropool_shared::Error::InvalidInput);
    }

    let token_a: Address = env.storage().instance().get(&crate::TOKEN_A_KEY).unwrap();
    let token_b: Address = env.storage().instance().get(&crate::TOKEN_B_KEY).unwrap();

    provider.require_auth();

    let token_client_a = token::Client::new(env, &token_a);
    let token_client_b = token::Client::new(env, &token_b);

    token_client_a.transfer(provider, &env.current_contract_address(), &amount_a);
    token_client_b.transfer(provider, &env.current_contract_address(), &amount_b);

    let lp_token: Address = env.storage().instance().get(&crate::LP_TOKEN_KEY).unwrap();
    let total_supply_args: Vec<Val> = ().into_val(env);
    let total_supply: i128 = env.invoke_contract(&lp_token, &Symbol::new(env, "total_supply"), total_supply_args);
    let new_reserve_a = reserve_a
        .checked_add(amount_a)
        .ok_or(soropool_shared::Error::Overflow)?;
    let new_reserve_b = reserve_b
        .checked_add(amount_b)
        .ok_or(soropool_shared::Error::Overflow)?;

    let lp_minted = math::calc_lp_tokens(amount_a, amount_b, reserve_a, reserve_b, total_supply)?;

    let mint_args: Vec<Val> = (provider.clone(), lp_minted).into_val(env);
    env.invoke_contract::<()>(&lp_token, &Symbol::new(env, "mint"), mint_args);

    env.storage().instance().set(&crate::RESERVE_A_KEY, &new_reserve_a);
    env.storage().instance().set(&crate::RESERVE_B_KEY, &new_reserve_b);

    crate::twap::update(env, new_reserve_a, new_reserve_b, now)?;

    events::emit_mint(env, provider, amount_a, amount_b, lp_minted, now);

    Ok((amount_a, amount_b, lp_minted))
}

pub fn remove_liquidity(
    env: &Env,
    provider: &Address,
    lp_amount: i128,
    amount_a_min: i128,
    amount_b_min: i128,
    deadline: u64,
) -> Result<(i128, i128), soropool_shared::Error> {
    let now = env.ledger().timestamp();
    if now > deadline {
        return Err(soropool_shared::Error::DeadlineExpired);
    }

    if lp_amount <= 0 {
        return Err(soropool_shared::Error::InvalidInput);
    }

    let reserve_a: i128 = env.storage().instance().get(&crate::RESERVE_A_KEY).unwrap();
    let reserve_b: i128 = env.storage().instance().get(&crate::RESERVE_B_KEY).unwrap();

    let lp_token: Address = env.storage().instance().get(&crate::LP_TOKEN_KEY).unwrap();
    let total_supply_args: Vec<Val> = ().into_val(env);
    let total_supply: i128 = env.invoke_contract(&lp_token, &Symbol::new(env, "total_supply"), total_supply_args);

    let (amount_a, amount_b) = math::calc_liquidity_ratio(lp_amount, total_supply, reserve_a, reserve_b)?;

    if amount_a < amount_a_min || amount_b < amount_b_min {
        return Err(soropool_shared::Error::SlippageExceeded);
    }

    provider.require_auth();

    let burn_args: Vec<Val> = (provider.clone(), lp_amount).into_val(env);
    env.invoke_contract::<()>(&lp_token, &Symbol::new(env, "burn"), burn_args);

    let new_reserve_a = reserve_a
        .checked_sub(amount_a)
        .ok_or(soropool_shared::Error::Overflow)?;
    let new_reserve_b = reserve_b
        .checked_sub(amount_b)
        .ok_or(soropool_shared::Error::Overflow)?;

    let token_a: Address = env.storage().instance().get(&crate::TOKEN_A_KEY).unwrap();
    let token_b: Address = env.storage().instance().get(&crate::TOKEN_B_KEY).unwrap();

    let token_client_a = token::Client::new(env, &token_a);
    let token_client_b = token::Client::new(env, &token_b);

    token_client_a.transfer(&env.current_contract_address(), provider, &amount_a);
    token_client_b.transfer(&env.current_contract_address(), provider, &amount_b);

    env.storage().instance().set(&crate::RESERVE_A_KEY, &new_reserve_a);
    env.storage().instance().set(&crate::RESERVE_B_KEY, &new_reserve_b);

    crate::twap::update(env, new_reserve_a, new_reserve_b, now)?;

    events::emit_burn(env, provider, amount_a, amount_b, lp_amount, now);

    Ok((amount_a, amount_b))
}
