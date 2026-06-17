use soroban_sdk::{Address, Env, String};

fn s(env: &Env, key: &str) -> String {
    String::from_str(env, key)
}

pub fn is_initialized(env: &Env) -> bool {
    env.storage().persistent().has(&s(env, "Init"))
}

pub fn set_initialized(env: &Env) {
    env.storage().persistent().set(&s(env, "Init"), &true);
}

pub fn set_admin(env: &Env, admin: &Address) {
    env.storage().persistent().set(&s(env, "Admin"), admin);
}

pub fn get_admin(env: &Env) -> Address {
    env.storage().persistent().get(&s(env, "Admin")).unwrap()
}

pub fn set_fee(env: &Env, fee: u128) {
    env.storage().persistent().set(&s(env, "Fee"), &fee);
}

pub fn get_fee(env: &Env) -> u128 {
    env.storage().persistent().get(&s(env, "Fee")).unwrap_or(30)
}

pub fn set_n_coins(env: &Env, n: u32) {
    env.storage().persistent().set(&s(env, "NCo"), &n);
}

pub fn get_n_coins(env: &Env) -> u32 {
    env.storage().persistent().get(&s(env, "NCo")).unwrap_or(2)
}

pub fn set_token(env: &Env, i: u32, token: &Address) {
    let key = if i == 0 { s(env, "Tk0") } else { s(env, "Tk1") };
    env.storage().persistent().set(&key, token);
}

pub fn get_token(env: &Env, i: u32) -> Address {
    let key = if i == 0 { s(env, "Tk0") } else { s(env, "Tk1") };
    env.storage().persistent().get(&key).unwrap()
}

pub fn set_balance(env: &Env, i: u32, balance: i128) {
    let key = if i == 0 { s(env, "Bl0") } else { s(env, "Bl1") };
    env.storage().persistent().set(&key, &balance);
}

pub fn get_balance(env: &Env, i: u32) -> i128 {
    let key = if i == 0 { s(env, "Bl0") } else { s(env, "Bl1") };
    env.storage().persistent().get(&key).unwrap_or(0)
}

pub fn set_lp_supply(env: &Env, supply: i128) {
    env.storage().persistent().set(&s(env, "LpS"), &supply);
}

pub fn get_lp_supply(env: &Env) -> i128 {
    env.storage().persistent().get(&s(env, "LpS")).unwrap_or(0)
}

pub fn set_lp_balance(env: &Env, owner: &Address, amount: i128) {
    env.storage().persistent().set(&(s(env, "Lp"), owner.clone()), &amount);
}

pub fn get_lp_balance(env: &Env, owner: &Address) -> i128 {
    env.storage()
        .persistent()
        .get(&(s(env, "Lp"), owner.clone()))
        .unwrap_or(0)
}
