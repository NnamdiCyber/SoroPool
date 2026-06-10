#![no_std]
use soroban_sdk::{contract, contractimpl, Address, Env, Vec};
use soropool_shared::types::{FeeTier, PoolInfo, PoolType};
use soropool_shared::Error;

mod deploy;
mod events;
mod storage;

fn check_deadline(env: &Env, deadline: u64) -> Result<(), Error> {
    if env.ledger().timestamp() > deadline {
        return Err(Error::DeadlineExpired);
    }
    Ok(())
}

#[contract]
pub struct PoolFactory;

#[contractimpl]
impl PoolFactory {
    pub fn initialize(env: Env, admin: Address, fee_recipient: Address) -> Result<(), Error> {
        if storage::is_initialized(&env) {
            return Err(Error::AlreadyInitialized);
        }
        admin.require_auth();
        storage::set_admin(&env, &admin);
        storage::set_fee_recipient(&env, &fee_recipient);
        deploy::upload_pool_wasm(&env);
        storage::set_initialized(&env);
        events::emit_factory_initialized(&env, &admin, &fee_recipient);
        Ok(())
    }

    pub fn create_constant_product_pool(
        env: Env,
        caller: Address,
        token_a: Address,
        token_b: Address,
        fee_tier: FeeTier,
        deadline: u64,
    ) -> Result<Address, Error> {
        check_deadline(&env, deadline)?;
        caller.require_auth();

        let (token_a, token_b) = storage::sort_tokens(token_a, token_b);
        if storage::pool_exists(&env, &token_a, &token_b, fee_tier) {
            return Err(Error::PoolAlreadyExists);
        }

        let pool = deploy::deploy_constant_product_pool(&env);
        storage::register_pool(
            &env,
            &pool,
            PoolType::ConstantProduct,
            &token_a,
            &token_b,
            fee_tier,
            &caller,
        );
        events::emit_pool_created(
            &env,
            &pool,
            PoolType::ConstantProduct,
            &token_a,
            &token_b,
            fee_tier,
            &caller,
        );
        Ok(pool)
    }

    pub fn create_stable_pool(
        env: Env,
        caller: Address,
        tokens: Vec<Address>,
        amplification: u128,
        fee_tier: FeeTier,
        deadline: u64,
    ) -> Result<Address, Error> {
        check_deadline(&env, deadline)?;
        caller.require_auth();

        if tokens.len() < 2 {
            return Err(Error::InvalidInput);
        }

        let token_a = tokens.get(0).unwrap();
        let token_b = tokens.get(1).unwrap();
        let (token_a, token_b) = storage::sort_tokens(token_a, token_b);

        if storage::pool_exists(&env, &token_a, &token_b, fee_tier) {
            return Err(Error::PoolAlreadyExists);
        }

        let pool = deploy::deploy_stable_pool(&env);
        let _ = amplification;

        storage::register_pool(
            &env,
            &pool,
            PoolType::StableSwap,
            &token_a,
            &token_b,
            fee_tier,
            &caller,
        );
        events::emit_pool_created(
            &env,
            &pool,
            PoolType::StableSwap,
            &token_a,
            &token_b,
            fee_tier,
            &caller,
        );
        Ok(pool)
    }

    pub fn create_concentrated_pool(
        env: Env,
        caller: Address,
        token_a: Address,
        token_b: Address,
        fee_tier: FeeTier,
        tick_spacing: i32,
        initial_sqrt_price: u128,
        deadline: u64,
    ) -> Result<Address, Error> {
        check_deadline(&env, deadline)?;
        caller.require_auth();

        let (token_a, token_b) = storage::sort_tokens(token_a, token_b);
        if storage::pool_exists(&env, &token_a, &token_b, fee_tier) {
            return Err(Error::PoolAlreadyExists);
        }

        let pool = deploy::deploy_concentrated_pool(&env);
        let _ = (tick_spacing, initial_sqrt_price);

        storage::register_pool(
            &env,
            &pool,
            PoolType::Concentrated,
            &token_a,
            &token_b,
            fee_tier,
            &caller,
        );
        events::emit_pool_created(
            &env,
            &pool,
            PoolType::Concentrated,
            &token_a,
            &token_b,
            fee_tier,
            &caller,
        );
        Ok(pool)
    }

    pub fn get_pool(
        env: Env,
        token_a: Address,
        token_b: Address,
        fee_tier: FeeTier,
    ) -> Option<Address> {
        let (token_a, token_b) = storage::sort_tokens(token_a, token_b);
        storage::get_pool(&env, &token_a, &token_b, fee_tier)
    }

    pub fn get_all_pools(env: Env, offset: u32, limit: u32) -> Vec<PoolInfo> {
        let all = storage::get_all_pools(&env);
        let len = all.len();
        let start = offset.min(len);
        let end = start.saturating_add(limit).min(len);

        let mut page = Vec::new(&env);
        for i in start..end {
            page.push_back(all.get(i).unwrap());
        }
        page
    }

    pub fn get_pool_count(env: Env) -> u32 {
        storage::get_pool_count(&env)
    }

    pub fn get_pool_owner(env: Env, pool: Address) -> Option<Address> {
        storage::get_pool_owner(&env, &pool)
    }

    pub fn set_fee_recipient(
        env: Env,
        caller: Address,
        new_recipient: Address,
        deadline: u64,
    ) -> Result<(), Error> {
        check_deadline(&env, deadline)?;
        let admin = storage::get_admin(&env);
        if caller != admin {
            return Err(Error::Unauthorized);
        }
        caller.require_auth();

        let previous = storage::get_fee_recipient(&env);
        storage::set_fee_recipient(&env, &new_recipient);
        events::emit_fee_recipient_updated(&env, &previous, &new_recipient);
        Ok(())
    }
}
