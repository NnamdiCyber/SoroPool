#![no_std]
use soroban_sdk::{contract, contractimpl, Address, Env, Vec};
use soropool_shared::types::{FeeTier, PoolInfo, PoolType};

mod events;
mod storage;

#[contract]
pub struct PoolFactory;

#[contractimpl]
impl PoolFactory {
    pub fn initialize(env: Env, admin: Address, fee_recipient: Address) -> Result<(), soropool_shared::Error> {
        storage::set_admin(&env, &admin);
        storage::set_fee_recipient(&env, &fee_recipient);
        events::emit_factory_initialized(&env, &admin, &fee_recipient);
        Ok(())
    }

    pub fn create_constant_product_pool(
        env: Env,
        token_a: Address,
        token_b: Address,
        fee_tier: FeeTier,
    ) -> Result<Address, soropool_shared::Error> {
        let pool = env.register_contract_wasm(None, soropool_constant_product_pool::WASM);
        storage::register_pool(&env, &pool, PoolType::ConstantProduct, &token_a, &token_b, fee_tier);
        events::emit_pool_created(&env, &pool, PoolType::ConstantProduct, &token_a, &token_b, fee_tier);
        Ok(pool)
    }

    pub fn create_stable_pool(
        env: Env,
        tokens: Vec<Address>,
        amplification: u128,
        fee_tier: FeeTier,
    ) -> Result<Address, soropool_shared::Error> {
        let pool = env.register_contract_wasm(None, soropool_stableswap_pool::WASM);
        storage::register_pool(&env, &pool, PoolType::StableSwap, &tokens.get(0).unwrap(), &tokens.get(1).unwrap(), fee_tier);
        events::emit_pool_created(&env, &pool, PoolType::StableSwap, &tokens.get(0).unwrap(), &tokens.get(1).unwrap(), fee_tier);
        Ok(pool)
    }

    pub fn create_concentrated_pool(
        env: Env,
        token_a: Address,
        token_b: Address,
        fee_tier: FeeTier,
        tick_spacing: i32,
        initial_sqrt_price: u128,
    ) -> Result<Address, soropool_shared::Error> {
        let pool = env.register_contract_wasm(None, soropool_concentrated_liquidity_pool::WASM);
        storage::register_pool(&env, &pool, PoolType::Concentrated, &token_a, &token_b, fee_tier);
        events::emit_pool_created(&env, &pool, PoolType::Concentrated, &token_a, &token_b, fee_tier);
        Ok(pool)
    }

    pub fn get_pool(
        env: Env,
        token_a: Address,
        token_b: Address,
        fee_tier: FeeTier,
    ) -> Option<Address> {
        storage::get_pool(&env, &token_a, &token_b, fee_tier)
    }

    pub fn get_all_pools(env: Env) -> Vec<PoolInfo> {
        storage::get_all_pools(&env)
    }

    pub fn set_fee_recipient(env: Env, new_recipient: Address) -> Result<(), soropool_shared::Error> {
        let admin = storage::get_admin(&env);
        admin.require_auth();
        storage::set_fee_recipient(&env, &new_recipient);
        events::emit_fee_recipient_updated(&env, &new_recipient);
        Ok(())
    }
}
