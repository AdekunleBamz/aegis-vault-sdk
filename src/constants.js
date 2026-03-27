export const NETWORKS = ['mainnet', 'testnet'];

export const API_BASE_URLS = {
  mainnet: 'https://api.mainnet.hiro.so',
  testnet: 'https://api.testnet.hiro.so',
};

export const DEFAULT_DEPLOYER_BY_NETWORK = {
  mainnet: 'SP3FKNEZ86RG5RT7SZ5FBRGH85FZNG94ZH1MCGG6N',
  testnet: 'SP3FKNEZ86RG5RT7SZ5FBRGH85FZNG94ZH1MCGG6N',
};

export const DEFAULT_CONTRACTS_BY_NETWORK = {
  mainnet: {
    staking: 'aegis-staking-v2-15',
    vault: 'aegis-vault-v3',
    rewards: 'aegis-rewards-v2-15',
    token: 'aegis-token-v2-15',
    treasury: 'aegis-treasury-v2-15',
  },
  testnet: {
    staking: 'aegis-staking-v2-15',
    vault: 'aegis-vault-v3',
    rewards: 'aegis-rewards-v2-15',
    token: 'aegis-token-v2-15',
    treasury: 'aegis-treasury-v2-15',
  },
};

export const LOCK_PERIOD_DAYS = [3, 7, 30];

export const STX_DECIMALS = 6;
