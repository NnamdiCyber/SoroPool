#![cfg(test)]

extern crate std;

use soroban_sdk::testutils::Address as _;
use soroban_sdk::{Address, Env, IntoVal, String, Symbol, Val, Vec};

use soropool_lp_token::{LpToken, LpTokenClient};

fn setup() -> (Env, Address, Address, Address) {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let minter = Address::generate(&env);
    let user = Address::generate(&env);
    let lp_token = env.register_contract(None, LpToken);
    let client = LpTokenClient::new(&env, &lp_token);

    client.initialize(
        &admin,
        &String::from_str(&env, "SoroPool LP"),
        &String::from_str(&env, "SLP"),
    );
    client.set_minter(&minter);

    (env, lp_token, minter, user)
}

fn mint_as_minter(env: &Env, lp_token: &Address, minter: &Address, to: &Address, amount: i128) {
    let args: Vec<Val> = (to.clone(), amount).into_val(env);
    env.invoke_contract::<()>(lp_token, &Symbol::new(env, "mint"), args);
    let _ = minter;
}

#[test]
fn test_mint_increases_balance_and_total_supply() {
    let (env, lp_token, minter, user) = setup();
    let client = LpTokenClient::new(&env, &lp_token);

    mint_as_minter(&env, &lp_token, &minter, &user, 1000);

    assert_eq!(client.balance_of(&user), 1000);
    assert_eq!(client.total_supply(), 1000);
}

#[test]
fn test_burn_decreases_balance_and_total_supply() {
    let (env, lp_token, minter, user) = setup();
    let client = LpTokenClient::new(&env, &lp_token);

    mint_as_minter(&env, &lp_token, &minter, &user, 1000);
    mint_as_minter(&env, &lp_token, &minter, &user, 500);

    let burn_args: Vec<Val> = (user.clone(), 400i128).into_val(&env);
    env.invoke_contract::<()>(
        &lp_token,
        &Symbol::new(&env, "burn"),
        burn_args,
    );

    assert_eq!(client.balance_of(&user), 1100);
    assert_eq!(client.total_supply(), 1100);
}

#[test]
fn test_unauthorized_mint_reverts() {
    // Use a fresh contract with no minter set — require_minter returns Err immediately
    let env = Env::default();
    env.mock_all_auths();
    let admin = Address::generate(&env);
    let user = Address::generate(&env);
    let lp_token = env.register_contract(None, LpToken);
    let client = LpTokenClient::new(&env, &lp_token);
    client.initialize(
        &admin,
        &String::from_str(&env, "SoroPool LP"),
        &String::from_str(&env, "SLP"),
    );
    // No set_minter call — has_minter is false, mint must fail
    let err = client.try_mint(&user, &100i128);
    assert!(err.is_err());
}

#[test]
fn test_transfer_updates_balances() {
    let (env, lp_token, minter, user) = setup();
    let client = LpTokenClient::new(&env, &lp_token);
    let recipient = Address::generate(&env);

    mint_as_minter(&env, &lp_token, &minter, &user, 1000);
    client.transfer(&user, &recipient, &300);

    assert_eq!(client.balance_of(&user), 700);
    assert_eq!(client.balance_of(&recipient), 300);
}

#[test]
fn test_approve_and_transfer_from() {
    let (env, lp_token, minter, user) = setup();
    let client = LpTokenClient::new(&env, &lp_token);
    let spender = Address::generate(&env);
    let recipient = Address::generate(&env);

    mint_as_minter(&env, &lp_token, &minter, &user, 1000);
    client.approve(&user, &spender, &500);

    assert_eq!(client.allowance(&user, &spender), 500);

    client.transfer_from(&spender, &user, &recipient, &200);

    assert_eq!(client.balance_of(&user), 800);
    assert_eq!(client.balance_of(&recipient), 200);
    assert_eq!(client.allowance(&user, &spender), 300);
}

#[test]
fn test_metadata() {
    let (env, lp_token, _, _) = setup();
    let client = LpTokenClient::new(&env, &lp_token);

    assert_eq!(client.name(), String::from_str(&env, "SoroPool LP"));
    assert_eq!(client.symbol(), String::from_str(&env, "SLP"));
    assert_eq!(client.decimals(), 7);
}
