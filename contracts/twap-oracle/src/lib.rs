#![no_std]
use soroban_sdk::{contract, contractimpl, Address, Env};

#[contract]
pub struct TwapOracle;

#[contractimpl]
impl TwapOracle {
    pub fn initialize(env: Env, pool: Address, window_seconds: u64) -> Result<(), soropool_shared::Error> {
        let _ = (env, pool, window_seconds);
        Ok(())
    }

    pub fn observe(env: Env, token_in: Address, amount_in: i128) -> i128 {
        let _ = (env, token_in, amount_in);
        unimplemented!()
    }

    pub fn update(env: Env) -> Result<(), soropool_shared::Error> {
        let _ = env;
        unimplemented!()
    }
}
