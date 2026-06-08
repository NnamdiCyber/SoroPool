import { registerAs } from '@nestjs/config';

export default registerAs('stellar', () => ({
  network: process.env.STELLAR_NETWORK || 'testnet',
  rpcUrl: process.env.STELLAR_RPC_URL || 'https://soroban-testnet.stellar.org',
  networkPassphrase:
    process.env.STELLAR_NETWORK_PASSPHRASE || 'Test SDF Network ; September 2015',
  horizonUrl:
    process.env.STELLAR_HORIZON_URL || 'https://horizon-testnet.stellar.org',
  contracts: {
    poolFactory: process.env.CONTRACT_POOL_FACTORY || '',
    router: process.env.CONTRACT_ROUTER || '',
    farm: process.env.CONTRACT_FARM || '',
    governance: process.env.CONTRACT_GOVERNANCE || '',
    splToken: process.env.CONTRACT_SPL_TOKEN || '',
  },
}));
