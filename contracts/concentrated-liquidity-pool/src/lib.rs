#![no_std]
use soroban_sdk::{contract, contractimpl, Address, Env};

mod fee_growth;
mod position;
mod sqrt_price;
mod tick;

#[contract]
pub struct ConcentratedLiquidityPool;

#[contractimpl]
impl ConcentratedLiquidityPool {
    pub fn mint_position(
        env: Env,
        recipient: Address,
        tick_lower: i32,
        tick_upper: i32,
        liquidity_desired: u128,
        amount0_max: i128,
        amount1_max: i128,
        deadline: u64,
    ) -> Result<(u128, i128, i128), soropool_shared::Error> {
        let _ = (env, recipient, tick_lower, tick_upper, liquidity_desired, amount0_max, amount1_max, deadline);
        unimplemented!()
    }

    pub fn increase_liquidity(
        env: Env,
        caller: Address,
        position_id: u128,
        liquidity_delta: u128,
        amount0_max: i128,
        amount1_max: i128,
        deadline: u64,
    ) -> Result<(i128, i128), soropool_shared::Error> {
        let _ = (env, caller, position_id, liquidity_delta, amount0_max, amount1_max, deadline);
        unimplemented!()
    }

    pub fn decrease_liquidity(
        env: Env,
        caller: Address,
        position_id: u128,
        liquidity_delta: u128,
        amount0_min: i128,
        amount1_min: i128,
        deadline: u64,
    ) -> Result<(i128, i128), soropool_shared::Error> {
        let _ = (env, caller, position_id, liquidity_delta, amount0_min, amount1_min, deadline);
        unimplemented!()
    }

    pub fn collect_fees(
        env: Env,
        caller: Address,
        position_id: u128,
        amount0_max: i128,
        amount1_max: i128,
    ) -> Result<(i128, i128), soropool_shared::Error> {
        let _ = (env, caller, position_id, amount0_max, amount1_max);
        unimplemented!()
    }

    pub fn swap(
        env: Env,
        caller: Address,
        zero_for_one: bool,
        amount_specified: i128,
        sqrt_price_limit: u128,
        recipient: Address,
        deadline: u64,
    ) -> Result<(i128, i128), soropool_shared::Error> {
        let _ = (env, caller, zero_for_one, amount_specified, sqrt_price_limit, recipient, deadline);
        unimplemented!()
    }

    pub fn get_position(env: Env, position_id: u128) -> position::PositionInfo {
        let _ = (env, position_id);
        unimplemented!()
    }

    pub fn get_slot0(env: Env) -> sqrt_price::Slot0 {
        let _ = env;
        unimplemented!()
    }
}
