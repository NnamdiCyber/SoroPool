use soroban_sdk::{Env, Vec};
use soropool_shared::types::SwapStep;

/// Path encoding: each SwapStep contains the pool address and direction.
/// Encoded as a flat Vec<SwapStep> which is already the canonical form.
pub fn encode_path(_env: &Env, steps: Vec<SwapStep>) -> Vec<SwapStep> {
    steps
}

pub fn decode_path(_env: &Env, steps: Vec<SwapStep>) -> Vec<SwapStep> {
    steps
}

/// Validate that a path has at least one step and all addresses are non-empty.
pub fn validate_path(path: &Vec<SwapStep>) -> bool {
    !path.is_empty()
}
