use soroban_sdk::Env;

pub fn update(env: &Env, reserve_a: i128, reserve_b: i128, current_time: u64) {
    let _ = (env, reserve_a, reserve_b, current_time);
    unimplemented!()
}

pub fn consult(
    env: &Env,
    token_in: &soroban_sdk::Address,
    amount_in: i128,
    window_seconds: u64,
) -> i128 {
    let _ = (env, token_in, amount_in, window_seconds);
    unimplemented!()
}
