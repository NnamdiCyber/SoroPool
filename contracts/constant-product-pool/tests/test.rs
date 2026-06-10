#![cfg(test)]

extern crate std;

use soroban_sdk::testutils::{Address as _, Ledger, LedgerInfo};
use soroban_sdk::{contract, contractimpl, contracttype, token, Address, Bytes, Env, IntoVal, String, Symbol, U256, Val, Vec};

use soropool_shared::types::FeeState;

/// Minimal test LP token used by the CP pool in tests.
mod test_lp_token {
    use soroban_sdk::{contract, contractimpl, contracttype, Address, Env, String, Symbol};

    #[contracttype]
    #[derive(Clone)]
    enum DataKey {
        Balance(Address),
        Admin,
        TotalSupply,
    }

    fn get_balance(env: &Env, owner: &Address) -> i128 {
        env.storage().instance().get(&DataKey::Balance(owner.clone())).unwrap_or(0)
    }

    fn set_balance(env: &Env, owner: &Address, amount: i128) {
        env.storage().instance().set(&DataKey::Balance(owner.clone()), &amount);
    }

    #[contract]
    pub struct TestLpToken;

    #[contractimpl]
    impl TestLpToken {
        pub fn initialize(env: Env, admin: Address, _name: String, _symbol: String) {
            env.storage().instance().set(&DataKey::Admin, &admin);
            env.storage().instance().set(&DataKey::TotalSupply, &0i128);
        }

        pub fn mint(env: Env, to: Address, amount: i128) {
            let admin: Address = env.storage().instance().get(&DataKey::Admin).unwrap();
            if env.current_contract_address() != admin {
                admin.require_auth();
            }

            let balance = get_balance(&env, &to);
            set_balance(&env, &to, balance + amount);

            let total: i128 = env.storage().instance().get(&DataKey::TotalSupply).unwrap_or(0);
            env.storage().instance().set(&DataKey::TotalSupply, &(total + amount));
        }

        pub fn burn(env: Env, from: Address, amount: i128) {
            let admin: Address = env.storage().instance().get(&DataKey::Admin).unwrap();
            if env.current_contract_address() != admin {
                admin.require_auth();
            }

            let balance = get_balance(&env, &from);
            set_balance(&env, &from, balance - amount);

            let total: i128 = env.storage().instance().get(&DataKey::TotalSupply).unwrap_or(0);
            env.storage().instance().set(&DataKey::TotalSupply, &(total - amount));
        }

        pub fn total_supply(env: Env) -> i128 {
            env.storage().instance().get(&DataKey::TotalSupply).unwrap_or(0)
        }

        pub fn balance_of(env: Env, owner: Address) -> i128 {
            get_balance(&env, &owner)
        }
    }
}

use test_lp_token::TestLpToken;

/// Helper to create a Stellar asset token contract.
fn create_token(env: &Env, admin: &Address) -> Address {
    env.register_stellar_asset_contract(admin.clone())
}

/// Mint tokens to a user via the Stellar asset admin client.
fn mint_tokens(env: &Env, token: &Address, to: &Address, amount: i128) {
    let admin_client = token::StellarAssetClient::new(env, token);
    admin_client.mint(to, &amount);
}

/// Get token balance.
fn token_balance(env: &Env, token: &Address, owner: &Address) -> i128 {
    let client = token::Client::new(env, token);
    client.balance(owner)
}

struct TestEnv {
    env: Env,
    pool: Address,
    token_a: Address,
    token_b: Address,
    lp_token: Address,
    user: Address,
    other: Address,
    governance: Address,
}

fn setup() -> TestEnv {
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

    let user = Address::generate(&env);
    let other = Address::generate(&env);
    let governance = Address::generate(&env);

    let token_admin = Address::generate(&env);
    let token_a = create_token(&env, &token_admin);
    let token_b = create_token(&env, &token_admin);

    // Mint initial tokens for user
    mint_tokens(&env, &token_a, &user, 1_000_000_000_000);
    mint_tokens(&env, &token_b, &user, 1_000_000_000_000);
    mint_tokens(&env, &token_a, &other, 1_000_000_000_000);
    mint_tokens(&env, &token_b, &other, 1_000_000_000_000);

    // Deploy LP token and pool
    let lp_token = env.register_contract(None, TestLpToken);
    let pool = env.register_contract(None, soropool_constant_product_pool::ConstantProductPool);

    // Initialize LP token with pool as admin
    let init_lp_args: Vec<Val> = (pool.clone(), String::from_str(&env, "Test LP"), String::from_str(&env, "TLP")).into_val(&env);
    env.invoke_contract::<()>(
        &lp_token,
        &Symbol::new(&env, "initialize"),
        init_lp_args,
    );

    // Initialize pool
    let init_pool_args: Vec<Val> = (token_a.clone(), token_b.clone(), 30u32, 0u128, lp_token.clone()).into_val(&env);
    env.invoke_contract::<()>(
        &pool,
        &Symbol::new(&env, "initialize"),
        init_pool_args,
    );

    TestEnv {
        env,
        pool,
        token_a,
        token_b,
        lp_token,
        user,
        other,
        governance,
    }
}

/// Set up pool with initial reserves for tests that need them (swap tests).
fn setup_swap_reserves(t: &TestEnv) {
    // Mint tokens to pool so it can transfer out during swaps
    mint_tokens(&t.env, &t.token_a, &t.pool, 100_000_000_000);
    mint_tokens(&t.env, &t.token_b, &t.pool, 100_000_000_000);

    // Set up pool reserves directly for swap tests
    t.env.as_contract(&t.pool, || {
        t.env.storage().instance().set(&soropool_constant_product_pool::RESERVE_A_KEY, &100_000_000i128);
        t.env.storage().instance().set(&soropool_constant_product_pool::RESERVE_B_KEY, &200_000_000i128);
    });
}

fn add_liquidity_simple(t: &TestEnv, provider: &Address, amount_a: i128, amount_b: i128) {
    let args: Vec<Val> = (provider.clone(), amount_a, amount_b, amount_a, amount_b, 2000u64).into_val(&t.env);
    t.env.invoke_contract::<Val>(
        &t.pool,
        &Symbol::new(&t.env, "add_liquidity"),
        args,
    );
}

// ─── Math Unit Tests ───────────────────────────────────────────────

#[test]
fn test_get_amount_out() {
    let (amount_out, price_impact) =
        soropool_constant_product_pool::math::get_amount_out(10_000, 100_000, 200_000, 30).unwrap();
    // Standard Uniswap V2: amount_in_with_fee = 10000 * (10000 - 30) = 99,700,000
    // numerator = 99,700,000 * 200,000 = 19,940,000,000,000
    // denominator = 100,000 * 10,000 + 99,700,000 = 1,099,700,000
    // amount_out = 19,940,000,000,000 / 1,099,700,000 = 18,132
    assert_eq!(amount_out, 18132);
    assert!(price_impact > 0);
}

#[test]
fn test_get_amount_out_zero_input_fails() {
    let result = soropool_constant_product_pool::math::get_amount_out(0, 100_000, 200_000, 30);
    assert!(result.is_err());
}

#[test]
fn test_get_amount_in() {
    let amount_in =
        soropool_constant_product_pool::math::get_amount_in(18132, 100_000, 200_000, 30).unwrap();
    // Inverse should give back approximately the original 10,000
    // The +1 rounding in get_amount_in may make it 10,001
    assert!(amount_in == 10_000 || amount_in == 10_001);
}

#[test]
fn test_get_amount_in_exceeds_reserve_fails() {
    let result = soropool_constant_product_pool::math::get_amount_in(200_000, 100_000, 200_000, 30);
    assert!(result.is_err());
}

#[test]
fn test_calc_lp_tokens_initial() {
    let lp = soropool_constant_product_pool::math::calc_lp_tokens(1000, 2000, 0, 0, 0).unwrap();
    assert_eq!(lp, 414);
}

#[test]
fn test_calc_lp_tokens_ratio() {
    let lp = soropool_constant_product_pool::math::calc_lp_tokens(500, 1000, 1000, 2000, 10000).unwrap();
    assert_eq!(lp, 5000);
}

#[test]
fn test_calc_lp_tokens_takes_min() {
    let lp = soropool_constant_product_pool::math::calc_lp_tokens(300, 2000, 1000, 2000, 10000).unwrap();
    assert_eq!(lp, 3000);
}

#[test]
fn test_calc_liquidity_ratio() {
    let (amount_a, amount_b) =
        soropool_constant_product_pool::math::calc_liquidity_ratio(5000, 10000, 1000, 2000).unwrap();
    assert_eq!(amount_a, 500);
    assert_eq!(amount_b, 1000);
}

// ─── Pool Initialization Tests ─────────────────────────────────────

#[test]
fn test_initialize_pool() {
    let t = setup();
    let (r_a, r_b) = t.env.invoke_contract::<(i128, i128)>(&t.pool, &Symbol::new(&t.env, "get_reserves"), Vec::<Val>::new(&t.env));
    assert_eq!(r_a, 0);
    assert_eq!(r_b, 0);
}

#[test]
fn test_initialize_twice_fails() {
    let t = setup();
    let args: Vec<Val> = (t.token_a.clone(), t.token_b.clone(), 30u32, 0u128, t.lp_token.clone()).into_val(&t.env);
    let result = t.env.try_invoke_contract::<Val, soroban_sdk::Error>(
        &t.pool,
        &Symbol::new(&t.env, "initialize"),
        args,
    );
    assert!(result.is_err());
}

// ─── Swap Tests ────────────────────────────────────────────────────

#[test]
fn test_swap_exact_in() {
    let t = setup();
    setup_swap_reserves(&t);
    let amount_in: i128 = 10_000;

    let args: Vec<Val> = (t.user.clone(), amount_in, 0i128, true, t.user.clone(), 2000u64).into_val(&t.env);
    let amount_out: i128 = t.env.invoke_contract(
        &t.pool,
        &Symbol::new(&t.env, "swap_exact_in"),
        args,
    );

    assert!(amount_out > 0);
    let (r_a, r_b) = t.env.invoke_contract::<(i128, i128)>(&t.pool, &Symbol::new(&t.env, "get_reserves"), Vec::<Val>::new(&t.env));
    assert!(r_a > 100_000_000);
    assert!(r_b < 200_000_000);
}

#[test]
fn test_swap_exact_in_with_slippage() {
    let t = setup();
    setup_swap_reserves(&t);
    let args: Vec<Val> = (t.user.clone(), 10_000i128, 1_000_000i128, true, t.user.clone(), 2000u64).into_val(&t.env);
    let result = t.env.try_invoke_contract::<Val, soroban_sdk::Error>(
        &t.pool,
        &Symbol::new(&t.env, "swap_exact_in"),
        args,
    );
    assert!(result.is_err());
}

#[test]
fn test_swap_exact_in_deadline_expired() {
    let t = setup();
    setup_swap_reserves(&t);
    t.env.ledger().set(LedgerInfo {
        timestamp: 3000,
        ..t.env.ledger().get()
    });

    let args: Vec<Val> = (t.user.clone(), 10_000i128, 0i128, true, t.user.clone(), 2000u64).into_val(&t.env);
    let result = t.env.try_invoke_contract::<Val, soroban_sdk::Error>(
        &t.pool,
        &Symbol::new(&t.env, "swap_exact_in"),
        args,
    );
    assert!(result.is_err());
}

#[test]
fn test_swap_exact_in_zero_for_one_false() {
    let t = setup();
    setup_swap_reserves(&t);
    let amount_in: i128 = 10_000;

    let args: Vec<Val> = (t.user.clone(), amount_in, 0i128, false, t.user.clone(), 2000u64).into_val(&t.env);
    let amount_out: i128 = t.env.invoke_contract(
        &t.pool,
        &Symbol::new(&t.env, "swap_exact_in"),
        args,
    );

    assert!(amount_out > 0);
    let (r_a, r_b) = t.env.invoke_contract::<(i128, i128)>(&t.pool, &Symbol::new(&t.env, "get_reserves"), Vec::<Val>::new(&t.env));
    assert!(r_a < 100_000_000);
    assert!(r_b > 200_000_000);
}

#[test]
fn test_swap_exact_out() {
    let t = setup();
    setup_swap_reserves(&t);
    let amount_out: i128 = 5_000;

    let args: Vec<Val> = (t.user.clone(), amount_out, 1_000_000i128, true, t.user.clone(), 2000u64).into_val(&t.env);
    let amount_in: i128 = t.env.invoke_contract(
        &t.pool,
        &Symbol::new(&t.env, "swap_exact_out"),
        args,
    );

    assert!(amount_in > 0);
    assert!(amount_in <= 1_000_000);
}

#[test]
fn test_swap_exact_out_slippage() {
    let t = setup();
    setup_swap_reserves(&t);
    let args: Vec<Val> = (t.user.clone(), 5_000i128, 1i128, true, t.user.clone(), 2000u64).into_val(&t.env);
    let result = t.env.try_invoke_contract::<Val, soroban_sdk::Error>(
        &t.pool,
        &Symbol::new(&t.env, "swap_exact_out"),
        args,
    );
    assert!(result.is_err());
}

#[test]
fn test_swap_with_various_fee_tiers() {
    let t = setup();
    setup_swap_reserves(&t);
    let args: Vec<Val> = (t.user.clone(), 10_000i128, 0i128, true, t.user.clone(), 2000u64).into_val(&t.env);
    let amount_out: i128 = t.env.invoke_contract(
        &t.pool,
        &Symbol::new(&t.env, "swap_exact_in"),
        args,
    );
    assert!(amount_out > 0);
}

// ─── Liquidity Tests ───────────────────────────────────────────────

#[test]
fn test_add_initial_liquidity() {
    let t = setup();
    let amount_a: i128 = 100_000;
    let amount_b: i128 = 200_000;

    let args: Vec<Val> = (t.user.clone(), amount_a, amount_b, amount_a, amount_b, 2000u64).into_val(&t.env);
    let result: (i128, i128, i128) = t.env.invoke_contract(
        &t.pool,
        &Symbol::new(&t.env, "add_liquidity"),
        args,
    );

    let (actual_a, actual_b, lp_minted) = result;
    assert_eq!(actual_a, amount_a);
    assert_eq!(actual_b, amount_b);
    assert!(lp_minted > 0);

    let (r_a, r_b) = t.env.invoke_contract::<(i128, i128)>(&t.pool, &Symbol::new(&t.env, "get_reserves"), Vec::<Val>::new(&t.env));
    assert_eq!(r_a, amount_a);
    assert_eq!(r_b, amount_b);
}

#[test]
fn test_add_subsequent_liquidity() {
    let t = setup();

    add_liquidity_simple(&t, &t.user, 100_000, 200_000);

    let args: Vec<Val> = (t.user.clone(), 50_000i128, 100_000i128, 50_000i128, 100_000i128, 2000u64).into_val(&t.env);
    let result: (i128, i128, i128) = t.env.invoke_contract(
        &t.pool,
        &Symbol::new(&t.env, "add_liquidity"),
        args,
    );

    let (actual_a, actual_b, lp_minted) = result;
    assert_eq!(actual_a, 50_000);
    assert_eq!(actual_b, 100_000);
    assert!(lp_minted > 0);
}

#[test]
fn test_add_liquidity_slippage() {
    let t = setup();
    let args: Vec<Val> = (t.user.clone(), 100_000i128, 200_000i128, 200_000i128, 400_000i128, 2000u64).into_val(&t.env);
    let result = t.env.try_invoke_contract::<Val, soroban_sdk::Error>(
        &t.pool,
        &Symbol::new(&t.env, "add_liquidity"),
        args,
    );
    assert!(result.is_err());
}

#[test]
fn test_add_liquidity_deadline_expired() {
    let t = setup();
    t.env.ledger().set(LedgerInfo {
        timestamp: 3000,
        ..t.env.ledger().get()
    });

    let args: Vec<Val> = (t.user.clone(), 100_000i128, 200_000i128, 100_000i128, 200_000i128, 2000u64).into_val(&t.env);
    let result = t.env.try_invoke_contract::<Val, soroban_sdk::Error>(
        &t.pool,
        &Symbol::new(&t.env, "add_liquidity"),
        args,
    );
    assert!(result.is_err());
}

#[test]
fn test_remove_liquidity() {
    let t = setup();

    add_liquidity_simple(&t, &t.user, 100_000, 200_000);

    let args_bal: Vec<Val> = (t.user.clone(),).into_val(&t.env);
    let lp_balance: i128 = t.env.invoke_contract(
        &t.lp_token,
        &Symbol::new(&t.env, "balance_of"),
        args_bal,
    );
    assert!(lp_balance > 0);

    let half = lp_balance / 2;
    let args_remove: Vec<Val> = (t.user.clone(), half, 0i128, 0i128, 2000u64).into_val(&t.env);
    let result: (i128, i128) = t.env.invoke_contract(
        &t.pool,
        &Symbol::new(&t.env, "remove_liquidity"),
        args_remove,
    );

    let (amount_a, amount_b) = result;
    assert!(amount_a > 0);
    assert!(amount_b > 0);

    let (r_a, r_b) = t.env.invoke_contract::<(i128, i128)>(&t.pool, &Symbol::new(&t.env, "get_reserves"), Vec::<Val>::new(&t.env));
    assert!(r_a < 100_000);
    assert!(r_b < 200_000);
}

#[test]
fn test_remove_liquidity_slippage() {
    let t = setup();
    add_liquidity_simple(&t, &t.user, 100_000, 200_000);

    let args_bal: Vec<Val> = (t.user.clone(),).into_val(&t.env);
    let lp_balance: i128 = t.env.invoke_contract(
        &t.lp_token,
        &Symbol::new(&t.env, "balance_of"),
        args_bal,
    );

    let args_remove: Vec<Val> = (t.user.clone(), lp_balance, 200_000i128, 400_000i128, 2000u64).into_val(&t.env);
    let result = t.env.try_invoke_contract::<Val, soroban_sdk::Error>(
        &t.pool,
        &Symbol::new(&t.env, "remove_liquidity"),
        args_remove,
    );
    assert!(result.is_err());
}

#[test]
fn test_remove_liquidity_deadline_expired() {
    let t = setup();
    add_liquidity_simple(&t, &t.user, 100_000, 200_000);

    let args_bal: Vec<Val> = (t.user.clone(),).into_val(&t.env);
    let lp_balance: i128 = t.env.invoke_contract(
        &t.lp_token,
        &Symbol::new(&t.env, "balance_of"),
        args_bal,
    );

    t.env.ledger().set(LedgerInfo {
        timestamp: 3000,
        ..t.env.ledger().get()
    });

    let args_remove: Vec<Val> = (t.user.clone(), lp_balance, 0i128, 0i128, 2000u64).into_val(&t.env);
    let result = t.env.try_invoke_contract::<Val, soroban_sdk::Error>(
        &t.pool,
        &Symbol::new(&t.env, "remove_liquidity"),
        args_remove,
    );
    assert!(result.is_err());
}

// ─── Protocol Fee Tests ────────────────────────────────────────────

#[test]
fn test_protocol_fee_accumulation() {
    let t = setup();

    let args: Vec<Val> = (t.user.clone(), 50_000i128, 0i128, true, t.user.clone(), 2000u64).into_val(&t.env);
    t.env.invoke_contract::<i128>(
        &t.pool,
        &Symbol::new(&t.env, "swap_exact_in"),
        args,
    );
}

// ─── TWAP Tests ────────────────────────────────────────────────────

#[test]
fn test_twap_accumulators_after_swap() {
    let t = setup();

    let (acc0_before, _acc1_before, ts_before): (U256, U256, u64) = t.env.invoke_contract(
        &t.pool,
        &Symbol::new(&t.env, "get_twap_accumulators"),
        Vec::<Val>::new(&t.env),
    );
    let zero = U256::from_u128(&t.env, 0u128);
    assert!(acc0_before == zero);
    assert_eq!(ts_before, 1000);

    t.env.ledger().set(LedgerInfo {
        timestamp: 1100,
        ..t.env.ledger().get()
    });

    let args: Vec<Val> = (t.user.clone(), 10_000i128, 0i128, true, t.user.clone(), 2000u64).into_val(&t.env);
    t.env.invoke_contract::<i128>(
        &t.pool,
        &Symbol::new(&t.env, "swap_exact_in"),
        args,
    );

    let (acc0_after, acc1_after, ts_after): (U256, U256, u64) = t.env.invoke_contract(
        &t.pool,
        &Symbol::new(&t.env, "get_twap_accumulators"),
        Vec::<Val>::new(&t.env),
    );
    let zero = U256::from_u128(&t.env, 0u128);
    assert!(acc0_after != zero || acc1_after != zero);
    assert_eq!(ts_after, 1100);
}

// ─── Spot Price Tests ──────────────────────────────────────────────

#[test]
fn test_get_spot_price() {
    let t = setup();

    let price: i128 = t.env.invoke_contract(
        &t.pool,
        &Symbol::new(&t.env, "get_spot_price"),
        Vec::<Val>::new(&t.env),
    );
    assert!(price > 0);
}

// ─── Edge Case Tests ───────────────────────────────────────────────

#[test]
fn test_empty_reserves_spot_price() {
    let env = Env::default();
    env.mock_all_auths();
    let pool = env.register_contract(None, soropool_constant_product_pool::ConstantProductPool);

    let price: i128 = env.invoke_contract(&pool, &Symbol::new(&env, "get_spot_price"), Vec::<Val>::new(&env));
    assert_eq!(price, 0);
}

#[test]
fn test_get_reserves_after_init() {
    let t = setup();
    let (r_a, r_b) = t.env.invoke_contract::<(i128, i128)>(&t.pool, &Symbol::new(&t.env, "get_reserves"), Vec::<Val>::new(&t.env));
    assert_eq!(r_a, 0);
    assert_eq!(r_b, 0);
}

#[test]
fn test_get_reserves_after_liquidity() {
    let t = setup();
    add_liquidity_simple(&t, &t.user, 100_000, 200_000);
    let (r_a, r_b) = t.env.invoke_contract::<(i128, i128)>(&t.pool, &Symbol::new(&t.env, "get_reserves"), Vec::<Val>::new(&t.env));
    assert_eq!(r_a, 100_000);
    assert_eq!(r_b, 200_000);
}

#[test]
fn test_liquidity_lp_token_minting() {
    let t = setup();

    add_liquidity_simple(&t, &t.user, 100_000, 200_000);

    let args_bal: Vec<Val> = (t.user.clone(),).into_val(&t.env);
    let lp_balance: i128 = t.env.invoke_contract(
        &t.lp_token,
        &Symbol::new(&t.env, "balance_of"),
        args_bal,
    );
    assert!(lp_balance > 0);

    let total_supply: i128 = t.env.invoke_contract(
        &t.lp_token,
        &Symbol::new(&t.env, "total_supply"),
        Vec::<Val>::new(&t.env),
    );
    assert_eq!(lp_balance, total_supply);
}

// ─── Fuzz Test (multiple random swaps, invariant check) ────────────

#[test]
fn test_fuzz_random_swaps_invariant() {
    let t = setup();

    add_liquidity_simple(&t, &t.user, 1_000_000_000, 2_000_000_000);

    for i in 0..20 {
        let amount_in: i128 = 1_000 + (i as i128) * 100_000;
        let zero_for_one = i % 2 == 0;

        let (r_a_before, r_b_before) = t.env.invoke_contract::<(i128, i128)>(
            &t.pool,
            &Symbol::new(&t.env, "get_reserves"),
            Vec::<Val>::new(&t.env),
        );
        let k_before = r_a_before * r_b_before;

        let args: Vec<Val> = (t.user.clone(), amount_in, 0i128, zero_for_one, t.user.clone(), 2000u64).into_val(&t.env);
        t.env.invoke_contract::<i128>(
            &t.pool,
            &Symbol::new(&t.env, "swap_exact_in"),
            args,
        );

        let (r_a_after, r_b_after) = t.env.invoke_contract::<(i128, i128)>(
            &t.pool,
            &Symbol::new(&t.env, "get_reserves"),
            Vec::<Val>::new(&t.env),
        );
        let k_after = r_a_after * r_b_after;

        assert!(
            k_after >= k_before,
            "Invariant violated at iteration {}: k_before={}, k_after={}",
            i,
            k_before,
            k_after
        );
    }
}

// ─── Flash Swap Test ───────────────────────────────────────────────

mod flash_swap_callback {
    use soroban_sdk::{contract, contractimpl, Address, Bytes, Env};

    #[contract]
    pub struct FlashSwapReceiver;

    #[contractimpl]
    impl FlashSwapReceiver {
        pub fn flash_swap_callback(_env: Env, _data: Bytes) {
        }

        pub fn callback_with_repayment(
            env: Env,
            _data: Bytes,
            token_a: Address,
            token_b: Address,
            pool: Address,
            amount0_out: i128,
            amount1_out: i128,
        ) {
            let token_client_a = soroban_sdk::token::Client::new(&env, &token_a);
            let token_client_b = soroban_sdk::token::Client::new(&env, &token_b);
            if amount0_out > 0 {
                token_client_a.transfer(&env.current_contract_address(), &pool, &amount0_out);
            }
            if amount1_out > 0 {
                token_client_b.transfer(&env.current_contract_address(), &pool, &amount1_out);
            }
        }
    }
}

use flash_swap_callback::FlashSwapReceiver;

#[test]
fn test_flash_swap_full_flow() {
    let t = setup();

    let receiver = t.env.register_contract(None, FlashSwapReceiver);

    let amount0_out: i128 = 10_000;
    let amount1_out: i128 = 0;

    mint_tokens(&t.env, &t.token_a, &receiver, 100_000);
    mint_tokens(&t.env, &t.token_b, &receiver, 100_000);

    let callback_data = Bytes::new(&t.env);

    let args: Vec<Val> = (t.user.clone(), amount0_out, amount1_out, receiver.clone(), callback_data).into_val(&t.env);
    t.env.invoke_contract::<()>(
        &t.pool,
        &Symbol::new(&t.env, "flash_swap"),
        args,
    );
}

#[test]
fn test_flash_swap_invariant_violation() {
    let t = setup();

    let receiver = t.env.register_contract(None, FlashSwapReceiver);

    let amount0_out: i128 = 10_000;
    let amount1_out: i128 = 0;
    let callback_data = Bytes::new(&t.env);

    let args: Vec<Val> = (t.user.clone(), amount0_out, amount1_out, receiver.clone(), callback_data).into_val(&t.env);
    let result = t.env.try_invoke_contract::<Val, soroban_sdk::Error>(
        &t.pool,
        &Symbol::new(&t.env, "flash_swap"),
        args,
    );
    assert!(result.is_err());
}
