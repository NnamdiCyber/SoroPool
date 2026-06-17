use soroban_sdk::{contracttype, Env};

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct PositionInfo {
    pub liquidity: u128,
    pub fee_growth_inside_0: u128,
    pub fee_growth_inside_1: u128,
    pub tokens_owed_0: i128,
    pub tokens_owed_1: i128,
}

pub fn get_position(env: &Env, position_id: u128) -> Option<PositionInfo> {
    env.storage().persistent().get(&position_id)
}

pub fn set_position(env: &Env, position_id: u128, pos: &PositionInfo) {
    env.storage().persistent().set(&position_id, pos);
}

pub fn next_position_id(env: &Env) -> u128 {
    let current: u128 = env.storage().persistent().get(&u128::MAX).unwrap_or(0);
    let next = current + 1;
    env.storage().persistent().set(&u128::MAX, &next);
    next
}
