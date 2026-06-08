use soroban_sdk::{Address, Env, Map, Vec};
use soropool_shared::types::{FeeTier, PoolInfo, PoolType};

const ADMIN_KEY: soroban_sdk::Symbol = soroban_sdk::symbol_short!("ADMIN");
const FEE_RECIPIENT_KEY: soroban_sdk::Symbol = soroban_sdk::symbol_short!("FEE_RCP");
const POOL_REGISTRY_KEY: soroban_sdk::Symbol = soroban_sdk::symbol_short!("POOL_REG");
const ALL_POOLS_KEY: soroban_sdk::Symbol = soroban_sdk::symbol_short!("ALL_POOL");
const POOL_COUNT_KEY: soroban_sdk::Symbol = soroban_sdk::symbol_short!("POOL_CNT");

pub fn set_admin(env: &Env, admin: &Address) {
    env.storage().instance().set(&ADMIN_KEY, admin);
}

pub fn get_admin(env: &Env) -> Address {
    env.storage().instance().get(&ADMIN_KEY).unwrap()
}

pub fn set_fee_recipient(env: &Env, recipient: &Address) {
    env.storage().instance().set(&FEE_RECIPIENT_KEY, recipient);
}

pub fn get_fee_recipient(env: &Env) -> Address {
    env.storage().instance().get(&FEE_RECIPIENT_KEY).unwrap()
}

pub fn register_pool(
    env: &Env,
    pool: &Address,
    pool_type: PoolType,
    token_a: &Address,
    token_b: &Address,
    fee_tier: FeeTier,
) {
    let mut registry: Map<(Address, Address, FeeTier), Address> = env
        .storage()
        .instance()
        .get(&POOL_REGISTRY_KEY)
        .unwrap_or_default();
    registry.set((token_a.clone(), token_b.clone(), fee_tier), pool.clone());
    env.storage().instance().set(&POOL_REGISTRY_KEY, &registry);

    let mut all_pools: Vec<PoolInfo> = env.storage().instance().get(&ALL_POOLS_KEY).unwrap_or_default();
    all_pools.push_back(PoolInfo {
        contract: pool.clone(),
        pool_type,
        token_a: token_a.clone(),
        token_b: token_b.clone(),
        fee_tier,
    });
    env.storage().instance().set(&ALL_POOLS_KEY, &all_pools);

    let count: u32 = env.storage().instance().get(&POOL_COUNT_KEY).unwrap_or(0);
    env.storage().instance().set(&POOL_COUNT_KEY, &(count + 1));
}

pub fn get_pool(env: &Env, token_a: &Address, token_b: &Address, fee_tier: FeeTier) -> Option<Address> {
    let registry: Map<(Address, Address, FeeTier), Address> = env
        .storage()
        .instance()
        .get(&POOL_REGISTRY_KEY)
        .unwrap_or_default();
    registry.get(&(token_a.clone(), token_b.clone(), fee_tier))
}

pub fn get_all_pools(env: &Env) -> Vec<PoolInfo> {
    env.storage().instance().get(&ALL_POOLS_KEY).unwrap_or_default()
}
