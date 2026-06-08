use soroban_sdk::Vec;
use soropool_shared::types::SwapStep;

pub fn encode_path(steps: Vec<SwapStep>) -> Vec<u8> {
    let _ = steps;
    unimplemented!()
}

pub fn decode_path(data: Vec<u8>) -> Vec<SwapStep> {
    let _ = data;
    unimplemented!()
}
