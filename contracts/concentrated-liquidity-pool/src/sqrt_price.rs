use soroban_sdk::{contracttype, Env};

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Slot0 {
    pub sqrt_price_x96: u128,
    pub tick: i32,
    pub liquidity: u128,
}

/// Convert a tick to a Q64.96 sqrt price.
/// sqrt_price = sqrt(1.0001^tick) in Q64.96 format.
/// This uses the precomputed bit-manipulation approach from the shared math library.
pub fn tick_to_sqrt_price(env: &Env, tick: i32) -> u128 {
    soropool_shared::math::sqrt_price_from_tick(env, tick)
}

/// Approximate tick from sqrt price (binary search).
pub fn price_to_tick(sqrt_price_x96: u128) -> i32 {
    if sqrt_price_x96 == 0 {
        return -887272;
    }
    let sqrt_f = sqrt_price_x96 as f64 / 79228162514264337593543950336.0; // 2^96 as f64
    let price = sqrt_f * sqrt_f;
    let tick_f = libm::log(price) / libm::log(1.0001f64);
    tick_f as i32
}

/// Compute token0 amount delta for a price range.
/// Δtoken0 = L * (1/√Pa - 1/√Pb)
pub fn get_amount0_delta(
    sqrt_ratio_a: u128,
    sqrt_ratio_b: u128,
    liquidity: u128,
    round_up: bool,
) -> i128 {
    let (lower, upper) = if sqrt_ratio_a <= sqrt_ratio_b {
        (sqrt_ratio_a, sqrt_ratio_b)
    } else {
        (sqrt_ratio_b, sqrt_ratio_a)
    };
    if lower == 0 || upper == 0 {
        return 0;
    }
    // Δtoken0 = liquidity * (upper - lower) / (lower * upper) in Q96
    // = liquidity * (upper - lower) << 96 / (lower * upper)
    let numerator = liquidity as u128 * (upper - lower);
    let denominator = (lower as u128 * upper as u128) >> 96;
    if denominator == 0 {
        return 0;
    }
    let result = if round_up {
        (numerator + denominator - 1) / denominator
    } else {
        numerator / denominator
    };
    result as i128
}

/// Compute token1 amount delta for a price range.
/// Δtoken1 = L * (√Pb - √Pa)
pub fn get_amount1_delta(
    sqrt_ratio_a: u128,
    sqrt_ratio_b: u128,
    liquidity: u128,
    round_up: bool,
) -> i128 {
    let (lower, upper) = if sqrt_ratio_a <= sqrt_ratio_b {
        (sqrt_ratio_a, sqrt_ratio_b)
    } else {
        (sqrt_ratio_b, sqrt_ratio_a)
    };
    // Δtoken1 = liquidity * (upper - lower) / 2^96
    let diff = upper.saturating_sub(lower);
    let result = (liquidity as u128 * diff) >> 96;
    if round_up && (liquidity as u128 * diff) & ((1u128 << 96) - 1) != 0 {
        (result + 1) as i128
    } else {
        result as i128
    }
}

/// Get next sqrt price given an exact input amount.
pub fn get_next_sqrt_price_from_input(
    sqrt_p: u128,
    liquidity: u128,
    amount_in: i128,
    zero_for_one: bool,
) -> u128 {
    if sqrt_p == 0 || liquidity == 0 || amount_in == 0 {
        return sqrt_p;
    }
    if zero_for_one {
        // Sell token0: price decreases
        // new_sqrt = L * sqrt_P / (L + amount0 * sqrt_P / 2^96)
        let product = (amount_in as u128).saturating_mul(sqrt_p) >> 96;
        let denom = liquidity + product;
        if denom == 0 {
            return sqrt_p;
        }
        (liquidity as u128 * sqrt_p / denom) as u128
    } else {
        // Sell token1: price increases
        // new_sqrt = sqrt_P + amount1 * 2^96 / L
        let delta = ((amount_in as u128) << 96) / liquidity;
        sqrt_p.saturating_add(delta)
    }
}

pub fn get_slot0(env: &Env) -> Slot0 {
    env.storage()
        .persistent()
        .get::<_, Slot0>(&soroban_sdk::symbol_short!("slot0"))
        .unwrap_or(Slot0 { sqrt_price_x96: 0, tick: 0, liquidity: 0 })
}

pub fn set_slot0(env: &Env, slot0: &Slot0) {
    env.storage()
        .persistent()
        .set(&soroban_sdk::symbol_short!("slot0"), slot0);
}
