use soroban_sdk::{Address, Env};

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
    unimplemented!()
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
    unimplemented!()
}
