use soroban_sdk::Vec;
use soropool_shared::types::{QuoteResult, SwapStep};

pub fn simulate_swap(amount_in: i128, path: Vec<SwapStep>) -> Result<QuoteResult, soropool_shared::Error> {
    let _ = (amount_in, path);
    unimplemented!()
}
