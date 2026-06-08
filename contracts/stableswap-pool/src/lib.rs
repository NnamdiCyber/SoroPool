#![no_std]
use soroban_sdk::{contract, contractimpl, Address, Env, Vec};

mod amplification;
mod invariant;

#[contract]
pub struct StableSwapPool;

#[contractimpl]
impl StableSwapPool {
    pub fn initialize(
        env: Env,
        tokens: Vec<Address>,
        a: u128,
        fee: u128,
    ) -> Result<(), soropool_shared::Error> {
        let _ = (env, tokens, a, fee);
        Ok(())
    }

    pub fn add_liquidity(
        env: Env,
        provider: Address,
        amounts: Vec<i128>,
        min_mint_amount: i128,
        deadline: u64,
    ) -> Result<i128, soropool_shared::Error> {
        let _ = (env, provider, amounts, min_mint_amount, deadline);
        unimplemented!()
    }

    pub fn remove_liquidity_one_coin(
        env: Env,
        provider: Address,
        token_amount: i128,
        coin_index: u32,
        min_amount: i128,
    ) -> Result<i128, soropool_shared::Error> {
        let _ = (env, provider, token_amount, coin_index, min_amount);
        unimplemented!()
    }

    pub fn exchange(
        env: Env,
        caller: Address,
        i: u32,
        j: u32,
        dx: i128,
        min_dy: i128,
        recipient: Address,
    ) -> Result<i128, soropool_shared::Error> {
        let _ = (env, caller, i, j, dx, min_dy, recipient);
        unimplemented!()
    }

    pub fn get_a(env: Env) -> u128 {
        let _ = env;
        unimplemented!()
    }

    pub fn ramp_a(env: Env, future_a: u128, future_time: u64) -> Result<(), soropool_shared::Error> {
        let _ = (env, future_a, future_time);
        unimplemented!()
    }

    pub fn get_d(env: Env) -> u128 {
        let _ = env;
        unimplemented!()
    }
}
