/// <reference types="cypress" />

describe('Liquidity E2E', () => {
  beforeEach(() => {
    cy.intercept('GET', '**/api/v1/pools*', {
      statusCode: 200,
      body: {
        data: [
          {
            id: 'pool-1',
            contractAddress: 'CPOOL123',
            poolType: 'constant_product',
            feeBps: 30,
            reserve0: '10000000',
            reserve1: '5000000',
            tvlUsd: '15000',
            volume24hUsd: '50000',
            lpCount: 12,
            isActive: true,
            token0: { id: 'tok-1', symbol: 'XLM', name: 'Stellar Lumens', decimals: 7 },
            token1: { id: 'tok-2', symbol: 'USDC', name: 'USD Coin', decimals: 7 },
          },
          {
            id: 'pool-2',
            contractAddress: 'CPOOL456',
            poolType: 'stableswap',
            feeBps: 5,
            reserve0: '20000000',
            reserve1: '20000000',
            tvlUsd: '40000',
            volume24hUsd: '1200000',
            lpCount: 8,
            isActive: true,
            token0: { id: 'tok-2', symbol: 'USDC', name: 'USD Coin', decimals: 7 },
            token1: { id: 'tok-3', symbol: 'USDT', name: 'Tether', decimals: 7 },
          },
        ],
        total: 2,
        page: 1,
        limit: 20,
      },
    }).as('getPools');

    cy.intercept('GET', '**/api/v1/pools/pool-1/stats', {
      statusCode: 200,
      body: {
        poolId: 'pool-1',
        spotPrice: 0.5,
        tvl: 15000,
        volume24h: 50000,
        fees24h: 150,
        apr: 3.65,
        reserve0: '10000000',
        reserve1: '5000000',
        lpCount: 12,
      },
    }).as('getPoolStats');

    cy.intercept('POST', '**/api/v1/liquidity/add/build', {
      statusCode: 200,
      body: { txXdr: 'AAAAAgAAAABmb2...' },
    }).as('buildAddLiquidity');
  });

  it('loads the pool list page', () => {
    cy.visit('/liquidity');
    cy.wait('@getPools');
    cy.contains('Pools').should('be.visible');
  });

  it('renders both pools in the list', () => {
    cy.visit('/liquidity');
    cy.wait('@getPools');
    cy.contains('XLM/USDC').should('be.visible');
    cy.contains('USDC/USDT').should('be.visible');
  });

  it('shows pool type badge CP for constant product', () => {
    cy.visit('/liquidity');
    cy.wait('@getPools');
    cy.contains('CP').should('be.visible');
  });

  it('shows pool type badge Stable for stableswap', () => {
    cy.visit('/liquidity');
    cy.wait('@getPools');
    cy.contains('Stable').should('be.visible');
  });

  it('shows TVL values formatted correctly', () => {
    cy.visit('/liquidity');
    cy.wait('@getPools');
    cy.contains('$').should('exist');
  });

  it('navigates to add liquidity when pool row is clicked', () => {
    cy.visit('/liquidity');
    cy.wait('@getPools');
    cy.get('tbody tr').first().click();
    cy.url().should('include', '/liquidity/add');
  });

  it('Create Pool button navigates to create pool page', () => {
    cy.visit('/liquidity');
    cy.wait('@getPools');
    cy.contains('Create Pool').click();
    cy.url().should('include', '/create-pool');
  });
});
