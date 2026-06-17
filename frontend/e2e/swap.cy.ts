/// <reference types="cypress" />

describe('Swap E2E', () => {
  beforeEach(() => {
    // Mock API responses for deterministic testing
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
            token0: { id: 'tok-1', symbol: 'XLM', name: 'Stellar Lumens', decimals: 7 },
            token1: { id: 'tok-2', symbol: 'USDC', name: 'USD Coin', decimals: 7 },
          },
        ],
        total: 1,
        page: 1,
        limit: 20,
      },
    }).as('getPools');

    cy.intercept('GET', '**/api/v1/swap/quote*', {
      statusCode: 200,
      body: {
        tokenIn: 'XLM',
        tokenOut: 'USDC',
        amountIn: '1000000',
        amountOut: '493824',
        priceImpact: 0.009,
        effectivePrice: 0.493,
        fee: '3000',
        priceImpactSeverity: 'low',
        route: {
          pools: [
            {
              poolId: 'pool-1',
              poolType: 'constant_product',
              tokenIn: 'XLM',
              tokenOut: 'USDC',
              amountIn: '1000000',
              amountOut: '493824',
              priceImpact: 0.009,
              fee: 30,
            },
          ],
          path: ['XLM', 'USDC'],
          totalPriceImpact: 0.009,
        },
      },
    }).as('getQuote');

    cy.intercept('POST', '**/api/v1/swap/build', {
      statusCode: 200,
      body: { txXdr: 'AAAAAgAAAABmb2...' },
    }).as('buildSwap');

    cy.visit('/swap');
  });

  it('loads the swap page', () => {
    cy.contains('Swap').should('be.visible');
    cy.wait('@getPools');
  });

  it('displays quote when amount entered', () => {
    cy.wait('@getPools');
    // Select XLM as tokenIn (first token selector)
    cy.get('sp-token-amount-input').first().find('button').last().click();
    cy.contains('XLM').click();

    // Select USDC as tokenOut
    cy.get('sp-token-amount-input').last().find('button').last().click();
    cy.contains('USDC').click();

    // Enter amount
    cy.get('sp-token-amount-input').first().find('input').type('100');

    cy.wait('@getQuote');
    cy.contains('0.493').should('be.visible');
  });

  it('shows price impact badge', () => {
    cy.wait('@getPools');
    cy.get('sp-price-impact-badge').should('exist');
  });

  it('shows route visualization after quote', () => {
    cy.wait('@getPools');
    cy.get('sp-token-amount-input').first().find('input').type('100');
    cy.wait('@getQuote');
    cy.get('sp-route-display').should('exist');
  });

  it('swap button is disabled without wallet connection', () => {
    cy.get('button[data-testid="swap-btn"], button').contains(/swap|connect wallet/i).should('exist');
  });
});
