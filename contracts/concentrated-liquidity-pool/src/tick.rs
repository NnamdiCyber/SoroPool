use soroban_sdk::{contracttype, Env};

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct TickInfo {
    pub liquidity_gross: u128,
    pub liquidity_net: i128,
    pub fee_growth_outside_0: u128,
    pub fee_growth_outside_1: u128,
    pub initialized: bool,
}

pub fn get_tick(env: &Env, tick: i32) -> Option<TickInfo> {
    env.storage().persistent().get(&tick)
}

pub fn set_tick(env: &Env, tick: i32, info: &TickInfo) {
    env.storage().persistent().set(&tick, info);
}

/// Flip a tick's initialized state, updating liquidity_gross.
/// Called when adding/removing a position's lower or upper tick boundary.
pub fn flip_tick(env: &Env, tick: i32, liquidity_delta: u128, upper: bool) {
    let mut info = get_tick(env, tick).unwrap_or(TickInfo {
        liquidity_gross: 0,
        liquidity_net: 0,
        fee_growth_outside_0: 0,
        fee_growth_outside_1: 0,
        initialized: false,
    });
    info.liquidity_gross = info.liquidity_gross.wrapping_add(liquidity_delta);
    if upper {
        info.liquidity_net = info.liquidity_net.wrapping_sub(liquidity_delta as i128);
    } else {
        info.liquidity_net = info.liquidity_net.wrapping_add(liquidity_delta as i128);
    }
    info.initialized = info.liquidity_gross > 0;
    set_tick(env, tick, &info);
}

/// Apply tick crossing: returns the liquidity_net to add/subtract.
pub fn cross_tick(env: &Env, tick: i32, fee_growth_global_0: u128, fee_growth_global_1: u128) -> i128 {
    if let Some(mut info) = get_tick(env, tick) {
        info.fee_growth_outside_0 = fee_growth_global_0.wrapping_sub(info.fee_growth_outside_0);
        info.fee_growth_outside_1 = fee_growth_global_1.wrapping_sub(info.fee_growth_outside_1);
        set_tick(env, tick, &info);
        info.liquidity_net
    } else {
        0
    }
}

pub fn is_tick_initialized(env: &Env, tick: i32) -> bool {
    get_tick(env, tick).map(|t| t.initialized).unwrap_or(false)
}
