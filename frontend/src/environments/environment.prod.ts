export const environment = {
  production: true,
  apiUrl: 'https://api.soropool.finance/api/v1',
  wsUrl: 'wss://api.soropool.finance',
  stellar: {
    network: 'mainnet',
    networkPassphrase: 'Public Global Stellar Network ; September 2015',
    horizonUrl: 'https://horizon.stellar.org',
    sorobanRpcUrl: 'https://soroban.stellar.org',
  },
  contracts: {
    poolFactory: 'CMAINFACTORY...',
    router: 'CMAINROUTER...',
    farm: 'CMAINFARM...',
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
