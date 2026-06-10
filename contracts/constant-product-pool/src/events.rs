use soroban_sdk::{Address, Env, Symbol};

pub fn emit_swap(
    env: &Env,
    caller: &Address,
    token_in: &Address,
    token_out: &Address,
    amount_in: i128,
    amount_out: i128,
    price_impact: i128,
    timestamp: u64,
) {
    env.events().publish(
        (Symbol::new(env, "swap"),),
        (
            caller,
            token_in,
            token_out,
            amount_in,
            amount_out,
            price_impact,
            timestamp,
        ),
    );
}

pub fn emit_mint(
    env: &Env,
    provider: &Address,
    amount_a: i128,
    amount_b: i128,
    lp_minted: i128,
    timestamp: u64,
) {
    env.events().publish(
        (Symbol::new(env, "mint"),),
        (provider, amount_a, amount_b, lp_minted, timestamp),
    );
}

pub fn emit_burn(
    env: &Env,
    provider: &Address,
    amount_a: i128,
    amount_b: i128,
    lp_burned: i128,
    timestamp: u64,
) {
    env.events().publish(
        (Symbol::new(env, "burn"),),
        (provider, amount_a, amount_b, lp_burned, timestamp),
    );
}

pub fn emit_protocol_fees_collected(
    env: &Env,
    caller: &Address,
    amount_a: i128,
    amount_b: i128,
) {
    env.events().publish(
        (Symbol::new(env, "protocol_fees_collected"),),
        (caller, amount_a, amount_b),
    );
}
