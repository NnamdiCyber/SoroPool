#![no_std]
use soroban_sdk::{contract, contractimpl, Address, Env};

#[contract]
pub struct Treasury;

#[contractimpl]
impl Treasury {
    pub fn initialize(env: Env, governance: Address) -> Result<(), soropool_shared::Error> {
        let _ = (env, governance);
        Ok(())
    }

    pub fn deposit(env: Env, caller: Address, token: Address, amount: i128) -> Result<(), soropool_shared::Error> {
        let _ = (env, caller, token, amount);
        unimplemented!()
    }

    pub fn withdraw(env: Env, caller: Address, token: Address, amount: i128, recipient: Address) -> Result<(), soropool_shared::Error> {
        let _ = (env, caller, token, amount, recipient);
        unimplemented!()
    }

    pub fn get_balance(env: Env, token: Address) -> i128 {
        let _ = (env, token);
        unimplemented!()
    }
}
