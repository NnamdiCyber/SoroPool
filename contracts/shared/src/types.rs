use soroban_sdk::{Address, Vec};

#[derive(Clone, Debug, Eq, PartialEq)]
#[soroban_sdk::contracttype]
pub enum PoolType {
    ConstantProduct,
    StableSwap,
    Concentrated,
}

pub type FeeTier = u32;

#[derive(Clone, Debug, Eq, PartialEq)]
#[soroban_sdk::contracttype]
pub struct PoolInfo {
    pub contract: Address,
    pub pool_type: PoolType,
    pub token_a: Address,
    pub token_b: Address,
    pub fee_tier: FeeTier,
}

#[derive(Clone, Debug, Eq, PartialEq)]
#[soroban_sdk::contracttype]
pub struct SwapStep {
    pub pool: Address,
    pub zero_for_one: bool,
}

#[derive(Clone, Debug, Eq, PartialEq)]
#[soroban_sdk::contracttype]
pub struct PositionInfo {
    pub liquidity: u128,
    pub tick_lower: i32,
    pub tick_upper: i32,
    pub fee_growth_inside_0: u128,
    pub fee_growth_inside_1: u128,
    pub tokens_owed_0: i128,
    pub tokens_owed_1: i128,
}

#[derive(Clone, Debug, Eq, PartialEq)]
#[soroban_sdk::contracttype]
pub struct Slot0 {
    pub sqrt_price_x96: u128,
    pub tick: i32,
    pub liquidity: u128,
}

#[derive(Clone, Debug, Eq, PartialEq)]
#[soroban_sdk::contracttype]
pub struct QuoteResult {
    pub amount_out: i128,
    pub price_impact: i128,
    pub path: Vec<SwapStep>,
}

#[derive(Clone, Debug, Eq, PartialEq)]
#[soroban_sdk::contracttype]
pub struct FeeState {
    pub protocol_fee_bps: u32,
    pub accumulated_fee_0: i128,
    pub accumulated_fee_1: i128,
}
