pub struct Slot0 {
    pub sqrt_price_x96: u128,
    pub tick: i32,
    pub liquidity: u128,
}

pub fn tick_to_price(tick: i32) -> u128 {
    let _ = tick;
    unimplemented!()
}

pub fn price_to_tick(price: u128) -> i32 {
    let _ = price;
    unimplemented!()
}

pub fn get_amount0_delta(
    sqrt_ratio_a: u128,
    sqrt_ratio_b: u128,
    liquidity: u128,
    round_up: bool,
) -> i128 {
    let _ = (sqrt_ratio_a, sqrt_ratio_b, liquidity, round_up);
    unimplemented!()
}

pub fn get_amount1_delta(
    sqrt_ratio_a: u128,
    sqrt_ratio_b: u128,
    liquidity: u128,
    round_up: bool,
) -> i128 {
    let _ = (sqrt_ratio_a, sqrt_ratio_b, liquidity, round_up);
    unimplemented!()
}
