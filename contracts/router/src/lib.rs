#![no_std]
use soroban_sdk::{contract, contractimpl, Address, Env, Vec};

mod path;
mod quote;

#[contract]
pub struct Router;

#[contractimpl]
impl Router {
    pub fn swap_exact_tokens_for_tokens(
        env: Env,
        caller: Address,
        amount_in: i128,
        amount_out_min: i128,
        path: Vec<soropool_shared::types::SwapStep>,
        recipient: Address,
        deadline: u64,
    ) -> Result<i128, soropool_shared::Error> {
        let _ = (env, caller, amount_in, amount_out_min, path, recipient, deadline);
        unimplemented!()
    }

    pub fn swap_tokens_for_exact_tokens(
        env: Env,
        caller: Address,
        amount_out: i128,
        amount_in_max: i128,
        path: Vec<soropool_shared::types::SwapStep>,
        recipient: Address,
        deadline: u64,
    ) -> Result<i128, soropool_shared::Error> {
        let _ = (env, caller, amount_out, amount_in_max, path, recipient, deadline);
        unimplemented!()
    }

    pub fn quote_exact_input(
        env: Env,
        amount_in: i128,
        path: Vec<soropool_shared::types::SwapStep>,
    ) -> Result<soropool_shared::types::QuoteResult, soropool_shared::Error> {
        let _ = (env, amount_in, path);
        unimplemented!()
    }
}
