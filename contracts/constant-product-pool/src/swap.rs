use soroban_sdk::{token, vec, Address, Env, IntoVal, Symbol, Val, Vec};

use crate::events;
use crate::fees;
use crate::math;

fn check_deadline(env: &Env, deadline: u64) -> Result<(), soropool_shared::Error> {
    let now = env.ledger().timestamp();
    if now > deadline {
        return Err(soropool_shared::Error::DeadlineExpired);
    }
    Ok(())
}

fn get_tokens(env: &Env) -> (Address, Address) {
    let token_a: Address = env.storage().instance().get(&crate::TOKEN_A_KEY).unwrap();
    let token_b: Address = env.storage().instance().get(&crate::TOKEN_B_KEY).unwrap();
    (token_a, token_b)
}

fn get_fee_tier(env: &Env) -> i128 {
    env.storage().instance().get(&crate::FEE_TIER_KEY).unwrap()
}

pub fn swap_exact_in(
    env: &Env,
    caller: &Address,
    amount_in: i128,
    amount_out_min: i128,
    zero_for_one: bool,
    recipient: &Address,
    deadline: u64,
) -> Result<i128, soropool_shared::Error> {
    check_deadline(env, deadline)?;
    if amount_in <= 0 {
        return Err(soropool_shared::Error::InvalidInput);
    }

    caller.require_auth();

    let (token_a, token_b) = get_tokens(env);
    let (token_in, token_out) = if zero_for_one {
        (token_a.clone(), token_b.clone())
    } else {
        (token_b.clone(), token_a.clone())
    };

    let reserve_a: i128 = env.storage().instance().get(&crate::RESERVE_A_KEY).unwrap();
    let reserve_b: i128 = env.storage().instance().get(&crate::RESERVE_B_KEY).unwrap();
    let (reserve_in, reserve_out) = if zero_for_one {
        (reserve_a, reserve_b)
    } else {
        (reserve_b, reserve_a)
    };

    let fee_bps = get_fee_tier(env);
    let (amount_out, price_impact) = math::get_amount_out(amount_in, reserve_in, reserve_out, fee_bps)?;

    if amount_out < amount_out_min {
        return Err(soropool_shared::Error::SlippageExceeded);
    }

    let fee_state = fees::get_fee_state(env);
    let (protocol_fee, _lp_fee) =
        fees::calculate_swap_fees(amount_in, fee_bps, fee_state.protocol_fee_bps as i128)?;

    let token_client_in = token::Client::new(env, &token_in);
    let token_client_out = token::Client::new(env, &token_out);

    token_client_in.transfer(caller, &env.current_contract_address(), &amount_in);

    let protocol_fee_a = if zero_for_one { protocol_fee } else { 0 };
    let protocol_fee_b = if zero_for_one { 0 } else { protocol_fee };
    fees::update_protocol_fees(env, protocol_fee_a, protocol_fee_b)?;

    token_client_out.transfer(&env.current_contract_address(), recipient, &amount_out);

    let new_reserve_a = if zero_for_one {
        reserve_a.checked_add(amount_in).ok_or(soropool_shared::Error::Overflow)?
    } else {
        reserve_a.checked_sub(amount_out).ok_or(soropool_shared::Error::Overflow)?
    };
    let new_reserve_b = if zero_for_one {
        reserve_b.checked_sub(amount_out).ok_or(soropool_shared::Error::Overflow)?
    } else {
        reserve_b.checked_add(amount_in).ok_or(soropool_shared::Error::Overflow)?
    };

    env.storage().instance().set(&crate::RESERVE_A_KEY, &new_reserve_a);
    env.storage().instance().set(&crate::RESERVE_B_KEY, &new_reserve_b);

    let now = env.ledger().timestamp();
    crate::twap::update(env, new_reserve_a, new_reserve_b, now)?;

    events::emit_swap(env, caller, &token_in, &token_out, amount_in, amount_out, price_impact, now);

    Ok(amount_out)
}

pub fn swap_exact_out(
    env: &Env,
    caller: &Address,
    amount_out: i128,
    amount_in_max: i128,
    zero_for_one: bool,
    recipient: &Address,
    deadline: u64,
) -> Result<i128, soropool_shared::Error> {
    check_deadline(env, deadline)?;
    if amount_out <= 0 {
        return Err(soropool_shared::Error::InvalidInput);
    }

    caller.require_auth();

    let (token_a, token_b) = get_tokens(env);
    let (token_in, token_out) = if zero_for_one {
        (token_a.clone(), token_b.clone())
    } else {
        (token_b.clone(), token_a.clone())
    };

    let reserve_a: i128 = env.storage().instance().get(&crate::RESERVE_A_KEY).unwrap();
    let reserve_b: i128 = env.storage().instance().get(&crate::RESERVE_B_KEY).unwrap();
    let (reserve_in, reserve_out) = if zero_for_one {
        (reserve_a, reserve_b)
    } else {
        (reserve_b, reserve_a)
    };

    let fee_bps = get_fee_tier(env);
    let amount_in = math::get_amount_in(amount_out, reserve_in, reserve_out, fee_bps)?;

    if amount_in > amount_in_max {
        return Err(soropool_shared::Error::SlippageExceeded);
    }

    let price_impact = amount_in
        .checked_mul(10_000)
        .ok_or(soropool_shared::Error::Overflow)?
        .checked_div(
            reserve_in
                .checked_add(amount_in)
                .ok_or(soropool_shared::Error::Overflow)?,
        )
        .ok_or(soropool_shared::Error::Overflow)?;

    let fee_state = fees::get_fee_state(env);
    let (protocol_fee, _lp_fee) =
        fees::calculate_swap_fees(amount_in, fee_bps, fee_state.protocol_fee_bps as i128)?;

    let token_client_in = token::Client::new(env, &token_in);
    let token_client_out = token::Client::new(env, &token_out);

    token_client_in.transfer(caller, &env.current_contract_address(), &amount_in);

    let protocol_fee_a = if zero_for_one { protocol_fee } else { 0 };
    let protocol_fee_b = if zero_for_one { 0 } else { protocol_fee };
    fees::update_protocol_fees(env, protocol_fee_a, protocol_fee_b)?;

    token_client_out.transfer(&env.current_contract_address(), recipient, &amount_out);

    let new_reserve_a = if zero_for_one {
        reserve_a.checked_add(amount_in).ok_or(soropool_shared::Error::Overflow)?
    } else {
        reserve_a.checked_sub(amount_out).ok_or(soropool_shared::Error::Overflow)?
    };
    let new_reserve_b = if zero_for_one {
        reserve_b.checked_sub(amount_out).ok_or(soropool_shared::Error::Overflow)?
    } else {
        reserve_b.checked_add(amount_in).ok_or(soropool_shared::Error::Overflow)?
    };

    env.storage().instance().set(&crate::RESERVE_A_KEY, &new_reserve_a);
    env.storage().instance().set(&crate::RESERVE_B_KEY, &new_reserve_b);

    let now = env.ledger().timestamp();
    crate::twap::update(env, new_reserve_a, new_reserve_b, now)?;

    events::emit_swap(env, caller, &token_in, &token_out, amount_in, amount_out, price_impact, now);

    Ok(amount_in)
}

pub fn flash_swap(
    env: &Env,
    caller: &Address,
    amount0_out: i128,
    amount1_out: i128,
    callback_contract: &Address,
    callback_data: &soroban_sdk::Bytes,
) -> Result<(), soropool_shared::Error> {
    caller.require_auth();

    let (token_a, token_b) = get_tokens(env);
    let token_client_a = token::Client::new(env, &token_a);
    let token_client_b = token::Client::new(env, &token_b);

    let balance_a_before = token_client_a.balance(&env.current_contract_address());
    let balance_b_before = token_client_b.balance(&env.current_contract_address());

    if amount0_out > balance_a_before || amount1_out > balance_b_before {
        return Err(soropool_shared::Error::InsufficientLiquidity);
    }

    if amount0_out > 0 {
        token_client_a.transfer(&env.current_contract_address(), callback_contract, &amount0_out);
    }
    if amount1_out > 0 {
        token_client_b.transfer(&env.current_contract_address(), callback_contract, &amount1_out);
    }

    let callback_args: Vec<Val> = (callback_data.clone(),).into_val(env);
    env.invoke_contract::<()>(callback_contract, &Symbol::new(env, "flash_swap_callback"), callback_args);

    let balance_a_after = token_client_a.balance(&env.current_contract_address());
    let balance_b_after = token_client_b.balance(&env.current_contract_address());

    let k_before = balance_a_before
        .checked_mul(balance_b_before)
        .ok_or(soropool_shared::Error::Overflow)?;
    let k_after = balance_a_after
        .checked_mul(balance_b_after)
        .ok_or(soropool_shared::Error::Overflow)?;

    if k_after < k_before {
        return Err(soropool_shared::Error::InsufficientLiquidity);
    }

    env.storage()
        .instance()
        .set(&crate::RESERVE_A_KEY, &balance_a_after);
    env.storage()
        .instance()
        .set(&crate::RESERVE_B_KEY, &balance_b_after);

    let now = env.ledger().timestamp();
    crate::twap::update(env, balance_a_after, balance_b_after, now)?;

    Ok(())
}
