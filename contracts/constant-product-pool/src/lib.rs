#![no_std]
use soroban_sdk::{contract, contractimpl, Address, Env};

mod events;
mod fees;
mod liquidity;
mod math;
mod swap;
mod twap;

#[contract]
pub struct ConstantProductPool;

#[contractimpl]
impl ConstantProductPool {
    pub fn initialize(
        env: Env,
        token_a: Address,
        token_b: Address,
        fee_tier: u32,
        sqrt_price_x96: u128,
    ) -> Result<(), soropool_shared::Error> {
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
        unimplemented!()
    }

    pub fn remove_liquidity(
        env: Env,
        provider: Address,
        lp_amount: i128,
        amount_a_min: i128,
        amount_b_min: i128,
        deadline: u64,
    ) -> Result<(i128, i128), soropool_shared::Error> {
        unimplemented!()
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
        unimplemented!()
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
        unimplemented!()
    }

    pub fn flash_swap(
        env: Env,
        caller: Address,
        amount0_out: i128,
        amount1_out: i128,
        callback_contract: Address,
        callback_data: soroban_sdk::Bytes,
    ) -> Result<(), soropool_shared::Error> {
        unimplemented!()
    }

    pub fn get_reserves(env: Env) -> (i128, i128) {
        unimplemented!()
    }

    pub fn get_spot_price(env: Env) -> i128 {
        unimplemented!()
    }

    pub fn get_twap_accumulators(env: Env) -> (u256, u256, u64) {
        unimplemented!()
    }
}
