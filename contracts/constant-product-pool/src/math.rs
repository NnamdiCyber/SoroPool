use soroban_sdk::Env;

pub const MINIMUM_LIQUIDITY: i128 = 1000;
const FEE_DENOMINATOR: i128 = 10_000;

pub fn get_amount_out(
    amount_in: i128,
    reserve_in: i128,
    reserve_out: i128,
    fee_bps: i128,
) -> Result<(i128, i128), soropool_shared::Error> {
    if amount_in <= 0 || reserve_in <= 0 || reserve_out <= 0 {
        return Err(soropool_shared::Error::InvalidInput);
    }
    let fee_multiplier = FEE_DENOMINATOR
        .checked_sub(fee_bps)
        .ok_or(soropool_shared::Error::InvalidFee)?;
    let amount_in_with_fee = amount_in
        .checked_mul(fee_multiplier)
        .ok_or(soropool_shared::Error::Overflow)?;
    let numerator = amount_in_with_fee
        .checked_mul(reserve_out)
        .ok_or(soropool_shared::Error::Overflow)?;
    let denominator = reserve_in
        .checked_mul(FEE_DENOMINATOR)
        .ok_or(soropool_shared::Error::Overflow)?
        .checked_add(amount_in_with_fee)
        .ok_or(soropool_shared::Error::Overflow)?;
    let amount_out = numerator
        .checked_div(denominator)
        .ok_or(soropool_shared::Error::Overflow)?;
    if amount_out <= 0 {
        return Err(soropool_shared::Error::InsufficientOutput);
    }
    let price_impact = amount_in
        .checked_mul(10_000)
        .ok_or(soropool_shared::Error::Overflow)?
        .checked_div(
            reserve_in
                .checked_add(amount_in)
                .ok_or(soropool_shared::Error::Overflow)?,
        )
        .ok_or(soropool_shared::Error::Overflow)?;
    Ok((amount_out, price_impact))
}

pub fn get_amount_in(
    amount_out: i128,
    reserve_in: i128,
    reserve_out: i128,
    fee_bps: i128,
) -> Result<i128, soropool_shared::Error> {
    if amount_out <= 0 || reserve_in <= 0 || reserve_out <= 0 {
        return Err(soropool_shared::Error::InvalidInput);
    }
    if amount_out >= reserve_out {
        return Err(soropool_shared::Error::InsufficientLiquidity);
    }
    let fee_multiplier = FEE_DENOMINATOR
        .checked_sub(fee_bps)
        .ok_or(soropool_shared::Error::InvalidFee)?;
    let numerator = reserve_in
        .checked_mul(amount_out)
        .ok_or(soropool_shared::Error::Overflow)?
        .checked_mul(FEE_DENOMINATOR)
        .ok_or(soropool_shared::Error::Overflow)?;
    let denominator = reserve_out
        .checked_sub(amount_out)
        .ok_or(soropool_shared::Error::Overflow)?
        .checked_mul(fee_multiplier)
        .ok_or(soropool_shared::Error::Overflow)?;
    let amount_in = numerator
        .checked_div(denominator)
        .ok_or(soropool_shared::Error::Overflow)?
        .checked_add(1)
        .ok_or(soropool_shared::Error::Overflow)?;
    Ok(amount_in)
}

pub fn calc_lp_tokens(
    amount_a: i128,
    amount_b: i128,
    reserve_a: i128,
    reserve_b: i128,
    total_supply: i128,
) -> Result<i128, soropool_shared::Error> {
    if amount_a <= 0 || amount_b <= 0 {
        return Err(soropool_shared::Error::InvalidInput);
    }
    if total_supply == 0 {
        let product = amount_a
            .checked_mul(amount_b)
            .ok_or(soropool_shared::Error::Overflow)?;
        let sqrt = integer_sqrt(product).ok_or(soropool_shared::Error::Overflow)?;
        let lp = sqrt
            .checked_sub(MINIMUM_LIQUIDITY)
            .ok_or(soropool_shared::Error::Overflow)?;
        if lp <= 0 {
            return Err(soropool_shared::Error::ZeroLiquidity);
        }
        Ok(lp)
    } else {
        let lp_from_a = amount_a
            .checked_mul(total_supply)
            .ok_or(soropool_shared::Error::Overflow)?
            .checked_div(reserve_a)
            .ok_or(soropool_shared::Error::Overflow)?;
        let lp_from_b = amount_b
            .checked_mul(total_supply)
            .ok_or(soropool_shared::Error::Overflow)?
            .checked_div(reserve_b)
            .ok_or(soropool_shared::Error::Overflow)?;
        Ok(core::cmp::min(lp_from_a, lp_from_b))
    }
}

pub fn calc_liquidity_ratio(
    lp_amount: i128,
    total_supply: i128,
    reserve_a: i128,
    reserve_b: i128,
) -> Result<(i128, i128), soropool_shared::Error> {
    if total_supply <= 0 || lp_amount <= 0 {
        return Err(soropool_shared::Error::InvalidInput);
    }
    if lp_amount > total_supply {
        return Err(soropool_shared::Error::InsufficientLiquidity);
    }
    let amount_a = lp_amount
        .checked_mul(reserve_a)
        .ok_or(soropool_shared::Error::Overflow)?
        .checked_div(total_supply)
        .ok_or(soropool_shared::Error::Overflow)?;
    let amount_b = lp_amount
        .checked_mul(reserve_b)
        .ok_or(soropool_shared::Error::Overflow)?
        .checked_div(total_supply)
        .ok_or(soropool_shared::Error::Overflow)?;
    Ok((amount_a, amount_b))
}

fn integer_sqrt(x: i128) -> Option<i128> {
    if x < 0 {
        return None;
    }
    if x == 0 {
        return Some(0);
    }
    let mut r = x;
    while r > x / r {
        let next = (r + x / r) / 2;
        if next >= r {
            break;
        }
        r = next;
    }
    Some(r)
}
