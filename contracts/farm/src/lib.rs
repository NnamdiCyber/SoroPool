#![no_std]
use soroban_sdk::{contract, contractimpl, Address, Env};

#[contract]
pub struct Farm;

#[contractimpl]
impl Farm {
    pub fn deposit(env: Env, caller: Address, pool: Address, amount: i128) -> Result<(), soropool_shared::Error> {
        let _ = (env, caller, pool, amount);
        unimplemented!()
    }

    pub fn withdraw(env: Env, caller: Address, pool: Address, amount: i128) -> Result<(), soropool_shared::Error> {
        let _ = (env, caller, pool, amount);
        unimplemented!()
    }

    pub fn harvest(env: Env, caller: Address, pool: Address) -> Result<i128, soropool_shared::Error> {
        let _ = (env, caller, pool);
        unimplemented!()
    }

    pub fn compound(env: Env, caller: Address, pool: Address) -> Result<(), soropool_shared::Error> {
        let _ = (env, caller, pool);
        unimplemented!()
    }

    pub fn pending_rewards(env: Env, caller: Address, pool: Address) -> i128 {
        let _ = (env, caller, pool);
        unimplemented!()
    }

    pub fn get_apr(env: Env, pool: Address) -> u128 {
        let _ = (env, pool);
        unimplemented!()
    }
}
