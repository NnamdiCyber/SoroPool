use soroban_sdk::{token, Address, Env};

use soropool_shared::{types::FeeState, Error};

use crate::events;

const FEE_STATE_KEY: soroban_sdk::Symbol = soroban_sdk::symbol_short!("FEE_STAT");
const GOVERNANCE_KEY: soroban_sdk::Symbol = soroban_sdk::symbol_short!("GOVRNCE");

pub fn set_governance(env: &Env, governance: &Address) {
    env.storage().instance().set(&GOVERNANCE_KEY, governance);
}

pub fn get_governance(env: &Env) -> Address {
    env.storage().instance().get(&GOVERNANCE_KEY).unwrap()
}

pub fn get_fee_state(env: &Env) -> FeeState {
    env.storage()
        .instance()
        .get(&FEE_STATE_KEY)
        .unwrap_or(FeeState {
            protocol_fee_bps: 1667,
            accumulated_fee_0: 0,
            accumulated_fee_1: 0,
        })
}

fn set_fee_state(env: &Env, state: &FeeState) {
    env.storage().instance().set(&FEE_STATE_KEY, state);
}

pub fn calculate_swap_fees(
    amount_in: i128,
    fee_bps: i128,
    protocol_fee_bps: i128,
) -> Result<(i128, i128), Error> {
    let fee_denominator: i128 = 10_000;
    let total_fee = amount_in
        .checked_mul(fee_bps)
        .ok_or(Error::Overflow)?
        .checked_div(fee_denominator)
        .ok_or(Error::Overflow)?;
    let protocol_fee = total_fee
        .checked_mul(protocol_fee_bps)
        .ok_or(Error::Overflow)?
        .checked_div(fee_denominator)
        .ok_or(Error::Overflow)?;
    let lp_fee = total_fee
        .checked_sub(protocol_fee)
        .ok_or(Error::Overflow)?;
    Ok((protocol_fee, lp_fee))
}

pub fn update_protocol_fees(env: &Env, fee_a: i128, fee_b: i128) -> Result<(), Error> {
    let mut state = get_fee_state(env);
    state.accumulated_fee_0 = state
        .accumulated_fee_0
        .checked_add(fee_a)
        .ok_or(Error::Overflow)?;
    state.accumulated_fee_1 = state
        .accumulated_fee_1
        .checked_add(fee_b)
        .ok_or(Error::Overflow)?;
    set_fee_state(env, &state);
    Ok(())
}

pub fn collect_protocol_fees(env: &Env, caller: &Address) -> Result<(), Error> {
    let governance = get_governance(env);
    if *caller != governance {
        return Err(Error::Unauthorized);
    }
    caller.require_auth();

    let state = get_fee_state(env);
    if state.accumulated_fee_0 <= 0 && state.accumulated_fee_1 <= 0 {
        return Err(Error::ZeroLiquidity);
    }

    let token_a: Address = env.storage().instance().get(&crate::TOKEN_A_KEY).unwrap();
    let token_b: Address = env.storage().instance().get(&crate::TOKEN_B_KEY).unwrap();

    let amount_a = state.accumulated_fee_0;
    let amount_b = state.accumulated_fee_1;

    if amount_a > 0 {
        let token_client = token::Client::new(env, &token_a);
        token_client.transfer(&env.current_contract_address(), caller, &amount_a);
    }
    if amount_b > 0 {
        let token_client = token::Client::new(env, &token_b);
        token_client.transfer(&env.current_contract_address(), caller, &amount_b);
    }

    let cleared = FeeState {
        protocol_fee_bps: state.protocol_fee_bps,
        accumulated_fee_0: 0,
        accumulated_fee_1: 0,
    };
    set_fee_state(env, &cleared);

    events::emit_protocol_fees_collected(env, caller, amount_a, amount_b);

    Ok(())
}
