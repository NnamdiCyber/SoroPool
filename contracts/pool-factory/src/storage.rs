use soroban_sdk::{Address, BytesN, Env, Map, Vec};
use soropool_shared::types::{FeeTier, PoolInfo, PoolType};

const ADMIN_KEY: &str = "ADMIN";
const FEE_RECIPIENT_KEY: &str = "FEE_RCP";
const POOL_REGISTRY_KEY: &str = "POOL_REG";
const ALL_POOLS_KEY: &str = "ALL_POOL";
const POOL_COUNT_KEY: &str = "POOL_CNT";
const POOL_OWNERS_KEY: &str = "POOL_OWN";
const INITIALIZED_KEY: &str = "INIT";
const CP_WASM_KEY: &str = "CP_WASM";
const STABLE_WASM_KEY: &str = "STBL_WASM";
const CL_WASM_KEY: &str = "CL_WASM";

fn sym(env: &Env, key: &str) -> soroban_sdk::Symbol {
    soroban_sdk::Symbol::new(env, key)
}

pub fn is_initialized(env: &Env) -> bool {
    env.storage().instance().has(&sym(env, INITIALIZED_KEY))
}

pub fn set_initialized(env: &Env) {
    env.storage()
        .instance()
        .set(&sym(env, INITIALIZED_KEY), &true);
}

pub fn set_admin(env: &Env, admin: &Address) {
    env.storage().instance().set(&sym(env, ADMIN_KEY), admin);
}

pub fn get_admin(env: &Env) -> Address {
    env.storage()
        .instance()
        .get(&sym(env, ADMIN_KEY))
        .unwrap()
}

pub fn set_fee_recipient(env: &Env, recipient: &Address) {
    env.storage()
        .instance()
        .set(&sym(env, FEE_RECIPIENT_KEY), recipient);
}

pub fn get_fee_recipient(env: &Env) -> Address {
    env.storage()
        .instance()
        .get(&sym(env, FEE_RECIPIENT_KEY))
        .unwrap()
}

pub fn set_cp_wasm_hash(env: &Env, hash: &BytesN<32>) {
    env.storage().instance().set(&sym(env, CP_WASM_KEY), hash);
}

pub fn get_cp_wasm_hash(env: &Env) -> BytesN<32> {
    env.storage()
        .instance()
        .get(&sym(env, CP_WASM_KEY))
        .unwrap()
}

pub fn set_stable_wasm_hash(env: &Env, hash: &BytesN<32>) {
    env.storage()
        .instance()
        .set(&sym(env, STABLE_WASM_KEY), hash);
}

pub fn get_stable_wasm_hash(env: &Env) -> BytesN<32> {
    env.storage()
        .instance()
        .get(&sym(env, STABLE_WASM_KEY))
        .unwrap()
}

pub fn set_cl_wasm_hash(env: &Env, hash: &BytesN<32>) {
    env.storage().instance().set(&sym(env, CL_WASM_KEY), hash);
}

pub fn get_cl_wasm_hash(env: &Env) -> BytesN<32> {
    env.storage()
        .instance()
        .get(&sym(env, CL_WASM_KEY))
        .unwrap()
}

pub fn get_pool_count(env: &Env) -> u32 {
    env.storage()
        .instance()
        .get(&sym(env, POOL_COUNT_KEY))
        .unwrap_or(0)
}

pub fn sort_tokens(token_a: Address, token_b: Address) -> (Address, Address) {
    if token_a < token_b {
        (token_a, token_b)
    } else {
        (token_b, token_a)
    }
}

pub fn register_pool(
    env: &Env,
    pool: &Address,
    pool_type: PoolType,
    token_a: &Address,
    token_b: &Address,
    fee_tier: FeeTier,
    deployer: &Address,
) {
    let reg_key = sym(env, POOL_REGISTRY_KEY);
    let mut registry: Map<(Address, Address, FeeTier), Address> = env
        .storage()
        .instance()
        .get(&reg_key)
        .unwrap_or_else(|| Map::new(env));
    registry.set(
        (token_a.clone(), token_b.clone(), fee_tier),
        pool.clone(),
    );
    env.storage().instance().set(&reg_key, &registry);

    let owners_key = sym(env, POOL_OWNERS_KEY);
    let mut owners: Map<Address, Address> = env
        .storage()
        .instance()
        .get(&owners_key)
        .unwrap_or_else(|| Map::new(env));
    owners.set(pool.clone(), deployer.clone());
    env.storage().instance().set(&owners_key, &owners);

    let all_key = sym(env, ALL_POOLS_KEY);
    let mut all_pools: Vec<PoolInfo> = env
        .storage()
        .instance()
        .get(&all_key)
        .unwrap_or_else(|| Vec::new(env));
    all_pools.push_back(PoolInfo {
        contract: pool.clone(),
        pool_type,
        token_a: token_a.clone(),
        token_b: token_b.clone(),
        fee_tier,
    });
    env.storage().instance().set(&all_key, &all_pools);

    let cnt_key = sym(env, POOL_COUNT_KEY);
    let count: u32 = env.storage().instance().get(&cnt_key).unwrap_or(0);
    env.storage().instance().set(&cnt_key, &(count + 1));
}

pub fn pool_exists(env: &Env, token_a: &Address, token_b: &Address, fee_tier: FeeTier) -> bool {
    get_pool(env, token_a, token_b, fee_tier).is_some()
}

pub fn get_pool(
    env: &Env,
    token_a: &Address,
    token_b: &Address,
    fee_tier: FeeTier,
) -> Option<Address> {
    let reg_key = sym(env, POOL_REGISTRY_KEY);
    let registry: Map<(Address, Address, FeeTier), Address> = env
        .storage()
        .instance()
        .get(&reg_key)
        .unwrap_or_else(|| Map::new(env));
    registry
        .get((token_a.clone(), token_b.clone(), fee_tier))
        .or_else(|| registry.get((token_b.clone(), token_a.clone(), fee_tier)))
}

pub fn get_pool_owner(env: &Env, pool: &Address) -> Option<Address> {
    let owners_key = sym(env, POOL_OWNERS_KEY);
    let owners: Map<Address, Address> = env
        .storage()
        .instance()
        .get(&owners_key)
        .unwrap_or_else(|| Map::new(env));
    owners.get(pool.clone())
}

pub fn get_all_pools(env: &Env) -> Vec<PoolInfo> {
    env.storage()
        .instance()
        .get(&sym(env, ALL_POOLS_KEY))
        .unwrap_or_else(|| Vec::new(env))
}

pub fn pool_salt(env: &Env) -> BytesN<32> {
    let count = get_pool_count(env);
    let mut bytes = [0u8; 32];
    bytes[0..4].copy_from_slice(&count.to_be_bytes());
    BytesN::from_array(env, &bytes)
}
