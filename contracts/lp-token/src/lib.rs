#![no_std]
use soroban_sdk::{contract, contractimpl, Address, Env, String};
use soropool_shared::Error;

mod storage;

fn require_minter(env: &Env) -> Result<(), Error> {
    if !storage::has_minter(env) {
        return Err(Error::Unauthorized);
    }
    let minter = storage::get_minter(env);
    minter.require_auth();
    Ok(())
}

#[contract]
pub struct LpToken;

#[contractimpl]
impl LpToken {
    pub fn initialize(
        env: Env,
        admin: Address,
        name: String,
        symbol: String,
    ) -> Result<(), Error> {
        if storage::is_initialized(&env) {
            return Err(Error::AlreadyInitialized);
        }
        admin.require_auth();
        storage::set_admin(&env, &admin);
        storage::set_name(&env, &name);
        storage::set_symbol(&env, &symbol);
        storage::set_decimals(&env, 7);
        storage::set_total_supply(&env, 0);
        storage::set_initialized(&env);
        Ok(())
    }

    /// Authorize a pool contract as the sole minter/burner.
    pub fn set_minter(env: Env, minter: Address) -> Result<(), Error> {
        let admin = storage::get_admin(&env);
        admin.require_auth();
        storage::set_minter(&env, &minter);
        Ok(())
    }

    pub fn mint(env: Env, to: Address, amount: i128) -> Result<(), Error> {
        if amount <= 0 {
            return Err(Error::InvalidInput);
        }
        require_minter(&env)?;

        let balance = storage::get_balance(&env, &to);
        storage::set_balance(&env, &to, balance + amount);

        let total = storage::get_total_supply(&env);
        storage::set_total_supply(&env, total + amount);
        Ok(())
    }

    pub fn burn(env: Env, from: Address, amount: i128) -> Result<(), Error> {
        if amount <= 0 {
            return Err(Error::InvalidInput);
        }
        require_minter(&env)?;

        let balance = storage::get_balance(&env, &from);
        if balance < amount {
            return Err(Error::InsufficientLiquidity);
        }
        storage::set_balance(&env, &from, balance - amount);

        let total = storage::get_total_supply(&env);
        storage::set_total_supply(&env, total - amount);
        Ok(())
    }

    pub fn balance_of(env: Env, owner: Address) -> i128 {
        storage::get_balance(&env, &owner)
    }

    pub fn total_supply(env: Env) -> i128 {
        storage::get_total_supply(&env)
    }

    pub fn transfer(env: Env, from: Address, to: Address, amount: i128) -> Result<(), Error> {
        if amount <= 0 {
            return Err(Error::InvalidInput);
        }
        from.require_auth();

        let from_balance = storage::get_balance(&env, &from);
        if from_balance < amount {
            return Err(Error::InsufficientLiquidity);
        }
        storage::set_balance(&env, &from, from_balance - amount);

        let to_balance = storage::get_balance(&env, &to);
        storage::set_balance(&env, &to, to_balance + amount);
        Ok(())
    }

    pub fn approve(
        env: Env,
        owner: Address,
        spender: Address,
        amount: i128,
    ) -> Result<(), Error> {
        owner.require_auth();
        storage::set_allowance(&env, &owner, &spender, amount);
        Ok(())
    }

    pub fn allowance(env: Env, owner: Address, spender: Address) -> i128 {
        storage::get_allowance(&env, &owner, &spender)
    }

    pub fn transfer_from(
        env: Env,
        spender: Address,
        from: Address,
        to: Address,
        amount: i128,
    ) -> Result<(), Error> {
        if amount <= 0 {
            return Err(Error::InvalidInput);
        }
        spender.require_auth();

        let allowance = storage::get_allowance(&env, &from, &spender);
        if allowance < amount {
            return Err(Error::Unauthorized);
        }
        storage::set_allowance(&env, &from, &spender, allowance - amount);

        let from_balance = storage::get_balance(&env, &from);
        if from_balance < amount {
            return Err(Error::InsufficientLiquidity);
        }
        storage::set_balance(&env, &from, from_balance - amount);

        let to_balance = storage::get_balance(&env, &to);
        storage::set_balance(&env, &to, to_balance + amount);
        Ok(())
    }

    pub fn name(env: Env) -> String {
        storage::get_name(&env)
    }

    pub fn symbol(env: Env) -> String {
        storage::get_symbol(&env)
    }

    pub fn decimals(env: Env) -> u32 {
        storage::get_decimals(&env)
    }
}
