use soroban_sdk::{Address, Env, Symbol};
use soropool_shared::types::{FeeTier, PoolType};

pub fn emit_factory_initialized(env: &Env, admin: &Address, fee_recipient: &Address) {
    env.events().publish(
        (Symbol::new(env, "factory_initialized"),),
        (admin, fee_recipient),
    );
}

pub fn emit_pool_created(
    env: &Env,
    pool: &Address,
    pool_type: PoolType,
    token_a: &Address,
    token_b: &Address,
    fee_tier: FeeTier,
) {
    env.events().publish(
        (
            Symbol::new(env, "pool_created"),
            Symbol::new(env, &format!("{:?}", pool_type)),
        ),
        (pool, token_a, token_b, fee_tier),
    );
}

pub fn emit_fee_recipient_updated(env: &Env, new_recipient: &Address) {
    env.events().publish(
        (Symbol::new(env, "fee_recipient_updated"),),
        (new_recipient,),
    );
}
