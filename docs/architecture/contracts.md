# Contract Interaction Diagram

## Deployment (Factory → Pools)

```
PoolFactory.create_constant_product_pool(tokenA, tokenB, feeTier)
    │
    ├─ Soroban create_contract(constant_product_pool.wasm)
    │  → returns new pool Address
    │
    ├─ Deploys LpToken contract for this pool
    │  LpToken.initialize(pool_address as admin, "SP-XLM/USDC", "SPL-LP")
    │  LpToken.set_minter(pool_address)
    │
    ├─ Registers pool in PoolRegistry storage
    │  (token_a, token_b, fee_tier) → pool_address
    │
    └─ Emits PoolCreated event
```

## Swap (Router → Pool)

```
Router.swap_exact_tokens_for_tokens(caller, amount_in, min_out, path, recipient, deadline)
    │
    └─ for each SwapStep in path:
           pool.swap_exact_in(caller, amount, 0, zero_for_one, next_hop_or_recipient, deadline)
               │
               ├─ TWAP.update(reserve_a, reserve_b, now)
               ├─ compute amount_out via constant-product math
               ├─ deduct fee → protocol_fee + lp_fee
               ├─ update reserves
               ├─ transfer token_in from caller (require_auth)
               ├─ transfer token_out to recipient
               └─ emit Swap event
```

## Liquidity (User → Pool → LP Token)

```
Pool.add_liquidity(provider, amount_a, amount_b, min_a, min_b, deadline)
    │
    ├─ transfer token_a from provider → pool
    ├─ transfer token_b from provider → pool
    ├─ calc LP tokens = sqrt(amount_a * amount_b) − MINIMUM_LIQUIDITY  (initial)
    │                 = min(amount_a/reserve_a, amount_b/reserve_b) * totalSupply  (subsequent)
    ├─ LpToken.mint(provider, lp_amount)
    └─ emit Mint event

Pool.remove_liquidity(provider, lp_amount, min_a, min_b, deadline)
    │
    ├─ LpToken.burn(provider, lp_amount)
    ├─ calc (amount_a, amount_b) = lp_amount / totalSupply * (reserve_a, reserve_b)
    ├─ transfer token_a → provider
    ├─ transfer token_b → provider
    └─ emit Burn event
```

## Farm (User → Farm Contract)

```
Farm.deposit(caller, pool_address, lp_amount)
    │
    ├─ LpToken.transfer_from(caller → farm_contract, lp_amount)
    ├─ Update user.reward_debt based on accSplPerShare
    └─ Record staked balance

Farm.harvest(caller, pool_address)
    │
    ├─ pending = user.staked * accSplPerShare - user.reward_debt
    ├─ SPL_Token.transfer(farm → caller, pending)
    └─ Update reward_debt
```

## Governance (SPL holders → DAO)

```
Governance.propose_upgrade(proposer, contract_id, new_wasm, description)
    │
    ├─ Requires minimum SPL stake to propose
    ├─ Creates Proposal { id, votes_for, votes_against, eta }
    └─ Emits ProposalCreated event

After 48h voting + 24h timelock:

Governance.execute_upgrade(proposal_id)
    │
    └─ Updates contract WASM on Soroban (upgradeable contracts pattern)
```
