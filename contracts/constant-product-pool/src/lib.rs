#![no_std]
use soroban_sdk::{contract, contractimpl, Address, Env, U256};

mod events;
mod fees;
mod liquidity;
pub mod math;
mod swap;
pub mod twap;

pub const TOKEN_A_KEY: soroban_sdk::Symbol = soroban_sdk::symbol_short!("TOKEN_A");
pub const TOKEN_B_KEY: soroban_sdk::Symbol = soroban_sdk::symbol_short!("TOKEN_B");
pub const LP_TOKEN_KEY: soroban_sdk::Symbol = soroban_sdk::symbol_short!("LPTOKEN");
pub const FEE_TIER_KEY: soroban_sdk::Symbol = soroban_sdk::symbol_short!("FEE_TIER");
pub const RESERVE_A_KEY: soroban_sdk::Symbol = soroban_sdk::symbol_short!("RSV_A");
pub const RESERVE_B_KEY: soroban_sdk::Symbol = soroban_sdk::symbol_short!("RSV_B");
pub const INIT_KEY: soroban_sdk::Symbol = soroban_sdk::symbol_short!("INIT_KEY");

#[contract]
pub struct ConstantProductPool;

#[contractimpl]
impl ConstantProductPool {
    pub fn initialize(
        env: Env,
        token_a: Address,
        token_b: Address,
        fee_tier: u32,
        _sqrt_price_x96: u128,
        lp_token: Address,
    ) -> Result<(), soropool_shared::Error> {
        if env.storage().instance().has(&INIT_KEY) {
            return Err(soropool_shared::Error::Unauthorized);
        }
        env.storage().instance().set(&TOKEN_A_KEY, &token_a);
        env.storage().instance().set(&TOKEN_B_KEY, &token_b);
        env.storage().instance().set(&LP_TOKEN_KEY, &lp_token);
        env.storage().instance().set(&FEE_TIER_KEY, &fee_tier);
        env.storage().instance().set(&RESERVE_A_KEY, &0i128);
        env.storage().instance().set(&RESERVE_B_KEY, &0i128);
        let deployer = env.current_contract_address();
        fees::set_governance(&env, &deployer);
        env.storage().instance().set(&INIT_KEY, &true);
        Ok(())
    }

    pub fn add_liquidity(
        env: Env,
        provider: Address,
        amount_a_desired: i128,
        amount_b_desired: i128,
        amount_a_min: i128,
        amount_b_min: i128,
        deadline: u64,
    ) -> Result<(i128, i128, i128), soropool_shared::Error> {
        liquidity::add_liquidity(
            &env,
            &provider,
            amount_a_desired,
            amount_b_desired,
            amount_a_min,
            amount_b_min,
            deadline,
        )
    }

    pub fn remove_liquidity(
        env: Env,
        provider: Address,
        lp_amount: i128,
        amount_a_min: i128,
        amount_b_min: i128,
        deadline: u64,
    ) -> Result<(i128, i128), soropool_shared::Error> {
        liquidity::remove_liquidity(
            &env,
            &provider,
            lp_amount,
            amount_a_min,
            amount_b_min,
            deadline,
        )
    }

    pub fn swap_exact_in(
        env: Env,
        caller: Address,
        amount_in: i128,
        amount_out_min: i128,
        zero_for_one: bool,
        recipient: Address,
        deadline: u64,
    ) -> Result<i128, soropool_shared::Error> {
        swap::swap_exact_in(
            &env, &caller, amount_in, amount_out_min, zero_for_one, &recipient, deadline,
        )
    }

    pub fn swap_exact_out(
        env: Env,
        caller: Address,
        amount_out: i128,
        amount_in_max: i128,
        zero_for_one: bool,
        recipient: Address,
        deadline: u64,
    ) -> Result<i128, soropool_shared::Error> {
        swap::swap_exact_out(
            &env, &caller, amount_out, amount_in_max, zero_for_one, &recipient, deadline,
        )
    }

    pub fn flash_swap(
        env: Env,
        caller: Address,
        amount0_out: i128,
        amount1_out: i128,
        callback_contract: Address,
        callback_data: soroban_sdk::Bytes,
    ) -> Result<(), soropool_shared::Error> {
        swap::flash_swap(
            &env, &caller, amount0_out, amount1_out, &callback_contract, &callback_data,
        )
    }

    pub fn collect_protocol_fees(
        env: Env,
        caller: Address,
    ) -> Result<(), soropool_shared::Error> {
        fees::collect_protocol_fees(&env, &caller)
    }

    pub fn get_reserves(env: Env) -> (i128, i128) {
        let reserve_a: i128 = env.storage().instance().get(&RESERVE_A_KEY).unwrap_or(0);
        let reserve_b: i128 = env.storage().instance().get(&RESERVE_B_KEY).unwrap_or(0);
        (reserve_a, reserve_b)
    }

    pub fn get_spot_price(env: Env) -> i128 {
        let reserve_a: i128 = env.storage().instance().get(&RESERVE_A_KEY).unwrap_or(0);
        let reserve_b: i128 = env.storage().instance().get(&RESERVE_B_KEY).unwrap_or(0);
        if reserve_a == 0 {
            return 0;
        }
        let q64_scalar: i128 = 18446744073709551616; // 2^64
        reserve_b
            .checked_mul(q64_scalar)
            .unwrap_or(0)
            .checked_div(reserve_a)
            .unwrap_or(0)
    }

    pub fn get_twap_accumulators(env: Env) -> (U256, U256, u64) {
        twap::get_accumulators(&env)
    }
}
