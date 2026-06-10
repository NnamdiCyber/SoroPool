#![cfg(test)]

extern crate std;

use soroban_sdk::testutils::{Address as _, Ledger, LedgerInfo};
use soroban_sdk::{Address, Env, IntoVal, Symbol, Val, Vec};

use soropool_pool_factory::{PoolFactory, PoolFactoryClient};
use soropool_shared::types::PoolType;

fn setup_env() -> Env {
    let env = Env::default();
    env.mock_all_auths();
    env.ledger().set(LedgerInfo {
        timestamp: 1000,
        protocol_version: 20,
        sequence_number: 10,
        network_id: [0; 32],
        base_reserve: 10,
        min_temp_entry_ttl: 100,
        min_persistent_entry_ttl: 100,
        max_entry_ttl: 200,
    });
    env
}

fn deadline(env: &Env) -> u64 {
    env.ledger().timestamp() + 3600
}

fn register_factory(env: &Env) -> Address {
    env.register_contract(None, PoolFactory)
}

#[test]
fn test_initialize_sets_admin() {
    let env = setup_env();
    let factory = register_factory(&env);
    let client = PoolFactoryClient::new(&env, &factory);

    let admin = Address::generate(&env);
    let fee_recipient = Address::generate(&env);

    client.initialize(&admin, &fee_recipient);

    let args: Vec<Val> = (admin.clone(), fee_recipient.clone(), deadline(&env)).into_val(&env);
    let err = env.try_invoke_contract::<()>(
        &factory,
        &Symbol::new(&env, "initialize"),
        args,
    );
    assert!(err.is_err());
}

#[test]
fn test_create_constant_product_pool_registers_and_returns_address() {
    let env = setup_env();
    let factory = register_factory(&env);
    let client = PoolFactoryClient::new(&env, &factory);

    let admin = Address::generate(&env);
    let fee_recipient = Address::generate(&env);
    let deployer = Address::generate(&env);
    let token_a = Address::generate(&env);
    let token_b = Address::generate(&env);

    client.initialize(&admin, &fee_recipient);

    let pool = client.create_constant_product_pool(
        &deployer,
        &token_a,
        &token_b,
        &30u32,
        &deadline(&env),
    );

    let stored = client.get_pool(&token_a, &token_b, &30u32);
    assert_eq!(stored, Some(pool.clone()));

    let owner = client.get_pool_owner(&pool);
    assert_eq!(owner, Some(deployer));
}

#[test]
fn test_duplicate_pool_creation_reverts() {
    let env = setup_env();
    let factory = register_factory(&env);
    let client = PoolFactoryClient::new(&env, &factory);

    let admin = Address::generate(&env);
    let fee_recipient = Address::generate(&env);
    let deployer = Address::generate(&env);
    let token_a = Address::generate(&env);
    let token_b = Address::generate(&env);

    client.initialize(&admin, &fee_recipient);

    client.create_constant_product_pool(
        &deployer,
        &token_a,
        &token_b,
        &30u32,
        &deadline(&env),
    );

    let err = client.try_create_constant_product_pool(
        &deployer,
        &token_a,
        &token_b,
        &30u32,
        &deadline(&env),
    );
    assert!(err.is_err());
}

#[test]
fn test_duplicate_pool_reverts_reversed_token_order() {
    let env = setup_env();
    let factory = register_factory(&env);
    let client = PoolFactoryClient::new(&env, &factory);

    let admin = Address::generate(&env);
    let fee_recipient = Address::generate(&env);
    let deployer = Address::generate(&env);
    let token_a = Address::generate(&env);
    let token_b = Address::generate(&env);

    client.initialize(&admin, &fee_recipient);

    client.create_constant_product_pool(
        &deployer,
        &token_a,
        &token_b,
        &30u32,
        &deadline(&env),
    );

    let err = client.try_create_constant_product_pool(
        &deployer,
        &token_b,
        &token_a,
        &30u32,
        &deadline(&env),
    );
    assert!(err.is_err());
}

#[test]
fn test_unauthorized_set_fee_recipient_reverts() {
    let env = setup_env();
    let factory = register_factory(&env);
    let client = PoolFactoryClient::new(&env, &factory);

    let admin = Address::generate(&env);
    let fee_recipient = Address::generate(&env);
    let attacker = Address::generate(&env);
    let new_recipient = Address::generate(&env);

    client.initialize(&admin, &fee_recipient);

    let err = client.try_set_fee_recipient(
        &attacker,
        &new_recipient,
        &deadline(&env),
    );
    assert!(err.is_err());
}

#[test]
fn test_admin_set_fee_recipient_succeeds() {
    let env = setup_env();
    let factory = register_factory(&env);
    let client = PoolFactoryClient::new(&env, &factory);

    let admin = Address::generate(&env);
    let fee_recipient = Address::generate(&env);
    let new_recipient = Address::generate(&env);

    client.initialize(&admin, &fee_recipient);
    client.set_fee_recipient(&admin, &new_recipient, &deadline(&env));
}

#[test]
fn test_get_all_pools_returns_correct_count() {
    let env = setup_env();
    let factory = register_factory(&env);
    let client = PoolFactoryClient::new(&env, &factory);

    let admin = Address::generate(&env);
    let fee_recipient = Address::generate(&env);
    let deployer = Address::generate(&env);

    client.initialize(&admin, &fee_recipient);

    let token_a = Address::generate(&env);
    let token_b = Address::generate(&env);
    let token_c = Address::generate(&env);

    client.create_constant_product_pool(
        &deployer,
        &token_a,
        &token_b,
        &30u32,
        &deadline(&env),
    );
    client.create_constant_product_pool(
        &deployer,
        &token_a,
        &token_c,
        &30u32,
        &deadline(&env),
    );

    assert_eq!(client.get_pool_count(), 2);

    let all = client.get_all_pools(&0u32, &10u32);
    assert_eq!(all.len(), 2);
    assert_eq!(all.get(0).unwrap().pool_type, PoolType::ConstantProduct);
}

#[test]
fn test_get_all_pools_pagination() {
    let env = setup_env();
    let factory = register_factory(&env);
    let client = PoolFactoryClient::new(&env, &factory);

    let admin = Address::generate(&env);
    let fee_recipient = Address::generate(&env);
    let deployer = Address::generate(&env);

    client.initialize(&admin, &fee_recipient);

    for _ in 0..3 {
        let token_a = Address::generate(&env);
        let token_b = Address::generate(&env);
        client.create_constant_product_pool(
            &deployer,
            &token_a,
            &token_b,
            &30u32,
            &deadline(&env),
        );
    }

    let page = client.get_all_pools(&1u32, &1u32);
    assert_eq!(page.len(), 1);
}

#[test]
fn test_create_pool_deadline_expired() {
    let env = setup_env();
    let factory = register_factory(&env);
    let client = PoolFactoryClient::new(&env, &factory);

    let admin = Address::generate(&env);
    let fee_recipient = Address::generate(&env);
    let deployer = Address::generate(&env);
    let token_a = Address::generate(&env);
    let token_b = Address::generate(&env);

    client.initialize(&admin, &fee_recipient);

    let err = client.try_create_constant_product_pool(
        &deployer,
        &token_a,
        &token_b,
        &30u32,
        &999u64,
    );
    assert!(err.is_err());
}
