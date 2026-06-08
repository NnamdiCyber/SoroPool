export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api/v1',
  wsUrl: 'ws://localhost:3001',
  stellar: {
    network: 'testnet',
    networkPassphrase: 'Test SDF Network ; September 2015',
    horizonUrl: 'https://horizon-testnet.stellar.org',
    sorobanRpcUrl: 'https://soroban-testnet.stellar.org',
  },
  contracts: {
    poolFactory: 'CTESTFACTORY...',
    router: 'CTESTROUTER...',
    farm: 'CTESTFARM...',
  },
  swap: {
    defaultSlippageBps: 50,
    defaultDeadlineMinutes: 30,
    priceImpactWarningThreshold: 0.05,
    priceImpactBlockThreshold: 0.15,
  },
  features: {
    concentratedLiquidity: true,
    flashSwaps: true,
    farming: true,
    governance: true,
  },
};
