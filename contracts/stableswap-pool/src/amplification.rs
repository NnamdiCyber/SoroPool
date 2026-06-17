use soroban_sdk::{Address, Env, String};
use soropool_shared::Error;

const MIN_RAMP_TIME: u64 = 86_400; // 1 day in seconds

fn s(env: &Env, key: &str) -> String {
    String::from_str(env, key)
}

pub fn set_initial_a(env: &Env, a: u128, timestamp: u64) {
    env.storage().persistent().set(&s(env, "A0"), &a);
    env.storage().persistent().set(&s(env, "T0"), &timestamp);
    env.storage().persistent().set(&s(env, "A1"), &a);
    env.storage().persistent().set(&s(env, "T1"), &timestamp);
}

pub fn get_current_a_with_env(env: &Env) -> u128 {
    let t0: u64 = env.storage().persistent().get(&s(env, "T0")).unwrap_or(0);
    let t1: u64 = env.storage().persistent().get(&s(env, "T1")).unwrap_or(0);
    let a0: u128 = env.storage().persistent().get(&s(env, "A0")).unwrap_or(0);
    let a1: u128 = env.storage().persistent().get(&s(env, "A1")).unwrap_or(0);

    let now = env.ledger().timestamp();
    if now >= t1 || t1 == t0 {
        return a1;
    }
    let elapsed = now.saturating_sub(t0);
    let total = t1.saturating_sub(t0);
    if a1 > a0 {
        a0 + (a1 - a0) * elapsed as u128 / total as u128
    } else {
        a0 - (a0 - a1) * elapsed as u128 / total as u128
    }
}

pub fn ramp_a_impl(env: &Env, admin: &Address, future_a: u128, future_time: u64) -> Result<(), Error> {
    admin.require_auth();
    let now = env.ledger().timestamp();
    if future_time < now + MIN_RAMP_TIME {
        return Err(Error::InvalidInput);
    }
    let current_a = get_current_a_with_env(env);
    env.storage().persistent().set(&s(env, "A0"), &current_a);
    env.storage().persistent().set(&s(env, "T0"), &now);
    env.storage().persistent().set(&s(env, "A1"), &future_a);
    env.storage().persistent().set(&s(env, "T1"), &future_time);
    Ok(())
}

/// Standalone stubs kept for backwards compatibility with the original lib.rs signature.
pub fn ramp_a(_future_a: u128, _future_time: u64) -> Result<(), Error> {
    Ok(())
}

pub fn get_current_a() -> u128 {
    0
}
