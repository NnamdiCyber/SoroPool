use soroban_sdk::Env;

/// Per-unit-liquidity fee growth accumulators.
pub fn update_fee_growth(
    fee_growth_global_0: u128,
    fee_growth_global_1: u128,
    liquidity: u128,
    fee_amount_0: i128,
    fee_amount_1: i128,
) -> (u128, u128) {
    if liquidity == 0 {
        return (fee_growth_global_0, fee_growth_global_1);
    }
    // fee_growth = fee_amount / liquidity  (Q128.128 fixed-point)
    // We use u128 overflow semantics — wrap-around is intentional (Uniswap v3 pattern).
    let delta_0 = (fee_amount_0.unsigned_abs() as u128) << 64;
    let delta_1 = (fee_amount_1.unsigned_abs() as u128) << 64;
    let new_0 = fee_growth_global_0.wrapping_add(delta_0 / liquidity);
    let new_1 = fee_growth_global_1.wrapping_add(delta_1 / liquidity);
    (new_0, new_1)
}

/// Compute fees owed for a position given global fee growth and the
/// fee growth inside the position's range at the time of last update.
pub fn fees_owed(
    fee_growth_inside_0_now: u128,
    fee_growth_inside_0_last: u128,
    fee_growth_inside_1_now: u128,
    fee_growth_inside_1_last: u128,
    liquidity: u128,
) -> (i128, i128) {
    let delta_0 = fee_growth_inside_0_now.wrapping_sub(fee_growth_inside_0_last);
    let delta_1 = fee_growth_inside_1_now.wrapping_sub(fee_growth_inside_1_last);
    let owed_0 = ((delta_0 as u128) * liquidity >> 64) as i128;
    let owed_1 = ((delta_1 as u128) * liquidity >> 64) as i128;
    (owed_0, owed_1)
}
