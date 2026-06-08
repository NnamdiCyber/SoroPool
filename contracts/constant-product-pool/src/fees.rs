use soroban_sdk::{Address, Env};

pub fn calculate_swap_fees(
    amount_in: i128,
    fee_bps: i128,
    protocol_fee_bps: i128,
) -> (i128, i128) {
    let fee_denominator: i128 = 10000;
    let total_fee = amount_in.checked_mul(fee_bps).unwrap().checked_div(fee_denominator).unwrap();
    let protocol_fee = total_fee.checked_mul(protocol_fee_bps).unwrap().checked_div(fee_denominator).unwrap();
    let lp_fee = total_fee.checked_sub(protocol_fee).unwrap();
    (protocol_fee, lp_fee)
}

pub fn collect_protocol_fees(
    env: &Env,
    caller: &Address,
) -> Result<(), soropool_shared::Error> {
    unimplemented!()
}
