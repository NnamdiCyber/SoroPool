use soroban_sdk::{Address, BytesN, Env};

use crate::storage;

#[cfg(feature = "test-deploy")]
pub fn deploy_constant_product_pool(env: &Env) -> Address {
    use soropool_constant_product_pool::ConstantProductPool;
    env.register_contract(None, ConstantProductPool)
}

#[cfg(not(feature = "test-deploy"))]
pub fn deploy_constant_product_pool(env: &Env) -> Address {
    let wasm_hash = storage::get_cp_wasm_hash(env);
    let salt = storage::pool_salt(env);
    env.deployer()
        .with_current_contract(salt)
        .deploy(wasm_hash)
}

#[cfg(feature = "test-deploy")]
pub fn deploy_stable_pool(env: &Env) -> Address {
    use soropool_stableswap_pool::StableSwapPool;
    env.register_contract(None, StableSwapPool)
}

#[cfg(not(feature = "test-deploy"))]
pub fn deploy_stable_pool(env: &Env) -> Address {
    let wasm_hash = storage::get_stable_wasm_hash(env);
    let salt = storage::pool_salt(env);
    env.deployer()
        .with_current_contract(salt)
        .deploy(wasm_hash)
}

#[cfg(feature = "test-deploy")]
pub fn deploy_concentrated_pool(env: &Env) -> Address {
    use soropool_concentrated_liquidity_pool::ConcentratedLiquidityPool;
    env.register_contract(None, ConcentratedLiquidityPool)
}

#[cfg(not(feature = "test-deploy"))]
pub fn deploy_concentrated_pool(env: &Env) -> Address {
    let wasm_hash = storage::get_cl_wasm_hash(env);
    let salt = storage::pool_salt(env);
    env.deployer()
        .with_current_contract(salt)
        .deploy(wasm_hash)
}

#[cfg(not(feature = "test-deploy"))]
pub fn upload_pool_wasm(env: &Env) {
    const CP_WASM: &[u8] = include_bytes!(concat!(
        env!("CARGO_MANIFEST_DIR"),
        "/../target/wasm32-unknown-unknown/release/soropool_constant_product_pool.wasm"
    ));
    const STABLE_WASM: &[u8] = include_bytes!(concat!(
        env!("CARGO_MANIFEST_DIR"),
        "/../target/wasm32-unknown-unknown/release/soropool_stableswap_pool.wasm"
    ));
    const CL_WASM: &[u8] = include_bytes!(concat!(
        env!("CARGO_MANIFEST_DIR"),
        "/../target/wasm32-unknown-unknown/release/soropool_concentrated_liquidity_pool.wasm"
    ));

    let cp_hash: BytesN<32> = env.deployer().upload_contract_wasm(CP_WASM);
    let stable_hash: BytesN<32> = env.deployer().upload_contract_wasm(STABLE_WASM);
    let cl_hash: BytesN<32> = env.deployer().upload_contract_wasm(CL_WASM);

    storage::set_cp_wasm_hash(env, &cp_hash);
    storage::set_stable_wasm_hash(env, &stable_hash);
    storage::set_cl_wasm_hash(env, &cl_hash);
}

#[cfg(feature = "test-deploy")]
pub fn upload_pool_wasm(_env: &Env) {}
