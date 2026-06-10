use soroban_sdk::{contracttype, Address, Env, String};

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Balance(Address),
    Allowance(Address, Address),
    Admin,
    Minter,
    Name,
    Symbol,
    TotalSupply,
    Decimals,
    Initialized,
}

pub fn is_initialized(env: &Env) -> bool {
    env.storage()
        .instance()
        .get(&DataKey::Initialized)
        .unwrap_or(false)
}

pub fn set_initialized(env: &Env) {
    env.storage()
        .instance()
        .set(&DataKey::Initialized, &true);
}

pub fn set_admin(env: &Env, admin: &Address) {
    env.storage().instance().set(&DataKey::Admin, admin);
}

pub fn get_admin(env: &Env) -> Address {
    env.storage().instance().get(&DataKey::Admin).unwrap()
}

pub fn set_minter(env: &Env, minter: &Address) {
    env.storage().instance().set(&DataKey::Minter, minter);
}

pub fn get_minter(env: &Env) -> Address {
    env.storage().instance().get(&DataKey::Minter).unwrap()
}

pub fn has_minter(env: &Env) -> bool {
    env.storage().instance().has(&DataKey::Minter)
}

pub fn set_name(env: &Env, name: &String) {
    env.storage().instance().set(&DataKey::Name, name);
}

pub fn get_name(env: &Env) -> String {
    env.storage().instance().get(&DataKey::Name).unwrap()
}

pub fn set_symbol(env: &Env, symbol: &String) {
    env.storage().instance().set(&DataKey::Symbol, symbol);
}

pub fn get_symbol(env: &Env) -> String {
    env.storage().instance().get(&DataKey::Symbol).unwrap()
}

pub fn set_decimals(env: &Env, decimals: u32) {
    env.storage().instance().set(&DataKey::Decimals, &decimals);
}

pub fn get_decimals(env: &Env) -> u32 {
    env.storage()
        .instance()
        .get(&DataKey::Decimals)
        .unwrap_or(7)
}

pub fn get_balance(env: &Env, owner: &Address) -> i128 {
    env.storage()
        .instance()
        .get(&DataKey::Balance(owner.clone()))
        .unwrap_or(0)
}

pub fn set_balance(env: &Env, owner: &Address, amount: i128) {
    env.storage()
        .instance()
        .set(&DataKey::Balance(owner.clone()), &amount);
}

pub fn get_total_supply(env: &Env) -> i128 {
    env.storage()
        .instance()
        .get(&DataKey::TotalSupply)
        .unwrap_or(0)
}

pub fn set_total_supply(env: &Env, amount: i128) {
    env.storage().instance().set(&DataKey::TotalSupply, &amount);
}

pub fn get_allowance(env: &Env, owner: &Address, spender: &Address) -> i128 {
    env.storage()
        .instance()
        .get(&DataKey::Allowance(owner.clone(), spender.clone()))
        .unwrap_or(0)
}

pub fn set_allowance(env: &Env, owner: &Address, spender: &Address, amount: i128) {
    env.storage().instance().set(
        &DataKey::Allowance(owner.clone(), spender.clone()),
        &amount,
    );
}
