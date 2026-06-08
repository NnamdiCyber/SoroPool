#![no_std]
use soroban_sdk::{contract, contractimpl, Address, Env, String};

#[contract]
pub struct LpToken;

#[contractimpl]
impl LpToken {
    pub fn initialize(env: Env, admin: Address, name: String, symbol: String) -> Result<(), soropool_shared::Error> {
        let _ = (env, admin, name, symbol);
        Ok(())
    }

    pub fn mint(env: Env, to: Address, amount: i128) -> Result<(), soropool_shared::Error> {
        let _ = (env, to, amount);
        unimplemented!()
    }

    pub fn burn(env: Env, from: Address, amount: i128) -> Result<(), soropool_shared::Error> {
        let _ = (env, from, amount);
        unimplemented!()
    }

    pub fn balance_of(env: Env, owner: Address) -> i128 {
        let _ = (env, owner);
        unimplemented!()
    }

    pub fn total_supply(env: Env) -> i128 {
        let _ = env;
        unimplemented!()
    }

    pub fn transfer(env: Env, from: Address, to: Address, amount: i128) -> Result<(), soropool_shared::Error> {
        let _ = (env, from, to, amount);
        unimplemented!()
    }

    pub fn approve(env: Env, owner: Address, spender: Address, amount: i128) -> Result<(), soropool_shared::Error> {
        let _ = (env, owner, spender, amount);
        unimplemented!()
    }

    pub fn transfer_from(
        env: Env,
        spender: Address,
        from: Address,
        to: Address,
        amount: i128,
    ) -> Result<(), soropool_shared::Error> {
        let _ = (env, spender, from, to, amount);
        unimplemented!()
    }

    pub fn name(env: Env) -> String {
        let _ = env;
        unimplemented!()
    }

    pub fn symbol(env: Env) -> String {
        let _ = env;
        unimplemented!()
    }

    pub fn decimals(env: Env) -> u32 {
        let _ = env;
        7
    }
}
