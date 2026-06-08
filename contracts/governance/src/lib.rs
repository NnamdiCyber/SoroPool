#![no_std]
use soroban_sdk::{contract, contractimpl, Address, Env};

#[contract]
pub struct Governance;

#[contractimpl]
impl Governance {
    pub fn initialize(env: Env, spl_token: Address, timelock_seconds: u64) -> Result<(), soropool_shared::Error> {
        let _ = (env, spl_token, timelock_seconds);
        Ok(())
    }

    pub fn propose(env: Env, proposer: Address, description: soroban_sdk::String) -> Result<u64, soropool_shared::Error> {
        let _ = (env, proposer, description);
        unimplemented!()
    }

    pub fn vote(env: Env, voter: Address, proposal_id: u64, support: bool) -> Result<(), soropool_shared::Error> {
        let _ = (env, voter, proposal_id, support);
        unimplemented!()
    }

    pub fn execute(env: Env, proposal_id: u64) -> Result<(), soropool_shared::Error> {
        let _ = (env, proposal_id);
        unimplemented!()
    }

    pub fn queue(env: Env, proposal_id: u64) -> Result<(), soropool_shared::Error> {
        let _ = (env, proposal_id);
        unimplemented!()
    }
}
