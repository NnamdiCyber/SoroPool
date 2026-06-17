#![no_std]
use soroban_sdk::{contract, contractimpl, Address, Env, IntoVal, Vec};

mod path;
mod quote;

use soropool_shared::types::SwapStep;
use soropool_shared::Error;

#[contract]
pub struct Router;

#[contractimpl]
impl Router {
    /// Execute multi-hop exact-input swap: spend exactly `amount_in`, receive >= `amount_out_min`.
    pub fn swap_exact_tokens_for_tokens(
        env: Env,
        caller: Address,
        amount_in: i128,
        amount_out_min: i128,
        path: Vec<SwapStep>,
        recipient: Address,
        deadline: u64,
    ) -> Result<i128, Error> {
        if env.ledger().timestamp() > deadline {
            return Err(Error::DeadlineExpired);
        }
        caller.require_auth();
        if !path::validate_path(&path) {
            return Err(Error::InvalidPath);
        }
        if amount_in <= 0 {
            return Err(Error::InvalidInput);
        }

        let mut current_amount = amount_in;
        let path_len = path.len();

        for (idx, step) in path.iter().enumerate() {
            let is_last = idx == path_len as usize - 1;
            let out_recipient: Address = if is_last {
                recipient.clone()
            } else {
                env.current_contract_address()
            };

            // Invoke pool.swap_exact_in via generic cross-contract call
            let args: soroban_sdk::Vec<soroban_sdk::Val> = soroban_sdk::vec![
                &env,
                caller.to_val(),
                current_amount.into_val(&env),
                0i128.into_val(&env),
                step.zero_for_one.into_val(&env),
                out_recipient.to_val(),
                deadline.into_val(&env),
            ];
            let out: i128 = env.invoke_contract(&step.pool, &soroban_sdk::symbol_short!("swpExIn"), args);
            current_amount = out;
        }

        if current_amount < amount_out_min {
            return Err(Error::SlippageExceeded);
        }

        Ok(current_amount)
    }

    /// Execute single-hop exact-output swap.
    pub fn swap_tokens_for_exact_tokens(
        env: Env,
        caller: Address,
        amount_out: i128,
        amount_in_max: i128,
        path: Vec<SwapStep>,
        recipient: Address,
        deadline: u64,
    ) -> Result<i128, Error> {
        if env.ledger().timestamp() > deadline {
            return Err(Error::DeadlineExpired);
        }
        caller.require_auth();
        if !path::validate_path(&path) {
            return Err(Error::InvalidPath);
        }
        if path.len() != 1 {
            return Err(Error::InvalidPath);
        }

        let step = path.get(0).ok_or(Error::InvalidPath)?;
        let args: soroban_sdk::Vec<soroban_sdk::Val> = soroban_sdk::vec![
            &env,
            caller.to_val(),
            amount_out.into_val(&env),
            amount_in_max.into_val(&env),
            step.zero_for_one.into_val(&env),
            recipient.to_val(),
            deadline.into_val(&env),
        ];
        let amount_in: i128 = env.invoke_contract(&step.pool, &soroban_sdk::symbol_short!("swpExOut"), args);

        if amount_in > amount_in_max {
            return Err(Error::SlippageExceeded);
        }

        Ok(amount_in)
    }

    /// View function: simulate quote for a given path without state changes.
    pub fn quote_exact_input(
        env: Env,
        amount_in: i128,
        path: Vec<SwapStep>,
    ) -> Result<soropool_shared::types::QuoteResult, Error> {
        quote::simulate_swap(&env, amount_in, path)
    }
}
