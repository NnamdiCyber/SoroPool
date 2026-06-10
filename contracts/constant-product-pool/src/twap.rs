use soroban_sdk::{Env, U256};

use soropool_shared::Error;

const PRICE_ACC_0_KEY: soroban_sdk::Symbol = soroban_sdk::symbol_short!("PACCUM0");
const PRICE_ACC_1_KEY: soroban_sdk::Symbol = soroban_sdk::symbol_short!("PACCUM1");
const LAST_TIME_KEY: soroban_sdk::Symbol = soroban_sdk::symbol_short!("LTSTAMP");

pub fn update(
    env: &Env,
    reserve_a: i128,
    reserve_b: i128,
    current_time: u64,
) -> Result<(), Error> {
    let last_timestamp: u64 = env
        .storage()
        .instance()
        .get(&LAST_TIME_KEY)
        .unwrap_or(current_time);

    if current_time > last_timestamp && reserve_a > 0 && reserve_b > 0 {
        let time_elapsed = current_time - last_timestamp;

        let shift: i128 = 1i128 << 64;
        let price_0 = reserve_b
            .checked_mul(shift)
            .ok_or(Error::Overflow)?
            .checked_div(reserve_a)
            .ok_or(Error::Overflow)?;

        let price_1 = reserve_a
            .checked_mul(shift)
            .ok_or(Error::Overflow)?
            .checked_div(reserve_b)
            .ok_or(Error::Overflow)?;

        let accum_0: U256 = env
            .storage()
            .instance()
            .get(&PRICE_ACC_0_KEY)
            .unwrap_or(U256::from_u128(env, 0u128));
        let accum_1: U256 = env
            .storage()
            .instance()
            .get(&PRICE_ACC_1_KEY)
            .unwrap_or(U256::from_u128(env, 0u128));

        let delta_0 = U256::from_u128(env, price_0 as u128)
            .mul(&U256::from_u32(env, time_elapsed as u32));
        let delta_1 = U256::from_u128(env, price_1 as u128)
            .mul(&U256::from_u32(env, time_elapsed as u32));

        env.storage()
            .instance()
            .set(&PRICE_ACC_0_KEY, &accum_0.add(&delta_0));
        env.storage()
            .instance()
            .set(&PRICE_ACC_1_KEY, &accum_1.add(&delta_1));
        env.storage().instance().set(&LAST_TIME_KEY, &current_time);
    }

    Ok(())
}

pub fn get_accumulators(env: &Env) -> (U256, U256, u64) {
    let accum_0: U256 = env
        .storage()
        .instance()
        .get(&PRICE_ACC_0_KEY)
        .unwrap_or(U256::from_u128(env, 0u128));
    let accum_1: U256 = env
        .storage()
        .instance()
        .get(&PRICE_ACC_1_KEY)
        .unwrap_or(U256::from_u128(env, 0u128));
    let last_timestamp: u64 = env.storage().instance().get(&LAST_TIME_KEY).unwrap_or(0);
    (accum_0, accum_1, last_timestamp)
}

pub fn consult(
    env: &Env,
    token_in: &soroban_sdk::Address,
    amount_in: i128,
    window_seconds: u64,
) -> Result<i128, Error> {
    if amount_in <= 0 || window_seconds == 0 {
        return Err(Error::InvalidInput);
    }

    let token_a: soroban_sdk::Address =
        env.storage().instance().get(&crate::TOKEN_A_KEY).unwrap();
    let (accum_0, accum_1, last_timestamp) = get_accumulators(env);

    let current_time = env.ledger().timestamp();
    let time_elapsed = current_time - last_timestamp;

    if time_elapsed > window_seconds {
        return Err(Error::InvalidInput);
    }

    if time_elapsed == 0 {
        let reserve_a: i128 = env.storage().instance().get(&crate::RESERVE_A_KEY).unwrap();
        let reserve_b: i128 = env.storage().instance().get(&crate::RESERVE_B_KEY).unwrap();
        if token_in == &token_a {
            return Ok(amount_in
                .checked_mul(reserve_b)
                .ok_or(Error::Overflow)?
                .checked_div(reserve_a)
                .ok_or(Error::Overflow)?);
        } else {
            return Ok(amount_in
                .checked_mul(reserve_a)
                .ok_or(Error::Overflow)?
                .checked_div(reserve_b)
                .ok_or(Error::Overflow)?);
        }
    }

    let (accum_start, accum_end) = if token_in == &token_a {
        (&accum_0, &accum_1)
    } else {
        (&accum_1, &accum_0)
    };

    let tick_price = accum_end.sub(accum_start).div(&U256::from_u32(env, time_elapsed as u32));

    let price = tick_price.to_u128().unwrap_or(0) as i128;

    let amount_out = amount_in
        .checked_mul(price)
        .ok_or(Error::Overflow)?
        .checked_div((1u128 << 64) as i128)
        .ok_or(Error::Overflow)?;

    Ok(amount_out)
}
