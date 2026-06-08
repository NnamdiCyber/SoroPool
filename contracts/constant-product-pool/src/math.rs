pub fn get_amount_out(
    amount_in: i128,
    reserve_in: i128,
    reserve_out: i128,
    fee_bps: i128,
) -> (i128, i128) {
    let fee_denominator: i128 = 10000;
    let amount_in_with_fee = amount_in.checked_mul(fee_denominator.checked_sub(fee_bps).unwrap()).unwrap();
    let numerator = amount_in_with_fee.checked_mul(reserve_out).unwrap();
    let denominator = reserve_in.checked_mul(fee_denominator).unwrap().checked_add(amount_in_with_fee).unwrap();
    let amount_out = numerator.checked_div(denominator).unwrap();
    let price_impact = 0;
    (amount_out, price_impact)
}

pub fn get_amount_in(
    amount_out: i128,
    reserve_in: i128,
    reserve_out: i128,
    fee_bps: i128,
) -> i128 {
    let fee_denominator: i128 = 10000;
    let numerator = reserve_in.checked_mul(amount_out).unwrap().checked_mul(fee_denominator).unwrap();
    let denominator = reserve_out.checked_sub(amount_out).unwrap().checked_mul(fee_denominator.checked_sub(fee_bps).unwrap()).unwrap();
    numerator.checked_div(denominator).unwrap().checked_add(1).unwrap()
}

pub fn calc_lp_tokens(
    amount_a: i128,
    amount_b: i128,
    reserve_a: i128,
    reserve_b: i128,
    total_supply: i128,
    minimum_liquidity: i128,
) -> i128 {
    if total_supply == 0 {
        let sqrt = |x: i128| -> i128 {
            if x == 0 { return 0; }
            let mut r = x;
            while r > x / r {
                r = (r + x / r) / 2;
            }
            r
        };
        let product = amount_a.checked_mul(amount_b).unwrap();
        sqrt(product).checked_sub(minimum_liquidity).unwrap()
    } else {
        let lp_from_a = amount_a.checked_mul(total_supply).unwrap().checked_div(reserve_a).unwrap();
        let lp_from_b = amount_b.checked_mul(total_supply).unwrap().checked_div(reserve_b).unwrap();
        if lp_from_a < lp_from_b { lp_from_a } else { lp_from_b }
    }
}

pub fn calc_liquidity_ratio(
    lp_amount: i128,
    total_supply: i128,
    reserve_a: i128,
    reserve_b: i128,
) -> (i128, i128) {
    let share = lp_amount.checked_mul(10000).unwrap().checked_div(total_supply).unwrap();
    let amount_a = reserve_a.checked_mul(share).unwrap().checked_div(10000).unwrap();
    let amount_b = reserve_b.checked_mul(share).unwrap().checked_div(10000).unwrap();
    (amount_a, amount_b)
}
