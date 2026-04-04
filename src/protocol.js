/**
 * Protocol metadata and typed helpers for the Aegis Vault ecosystem.
 */

/** @typedef {'mainnet' | 'testnet' | 'devnet'} NetworkType */
/** @typedef {{ address: string, network: NetworkType, isValid: boolean }} StacksAddress */
/** @typedef {{ contractAddress: string, contractName: string, network: NetworkType }} VaultConfig */

export const PROTOCOL_VERSION = '0.2.0';

/** @type {Readonly<VaultConfig>} */
export const DEFAULT_PROTOCOL_CONFIG = Object.freeze({
  contractAddress: 'SPXXXX',
  contractName: 'aegis-vault-core',
  network: 'mainnet',
});

let protocolConfig = { ...DEFAULT_PROTOCOL_CONFIG };

/**
 * @param {Partial<VaultConfig>} [options={}]
 * @returns {VaultConfig & { version: string }}
 */
export function initializeProtocol(options = {}) {
  protocolConfig = {
    ...DEFAULT_PROTOCOL_CONFIG,
    ...options,
  };

  return getProtocolConfig();
}

/**
 * @returns {string}
 */
export function getProtocolVersion() {
  return PROTOCOL_VERSION;
}

/**
 * @returns {VaultConfig & { version: string }}
 */
export function getProtocolConfig() {
  return {
    ...protocolConfig,
    version: PROTOCOL_VERSION,
  };
}

/**
 * @param {string} address
 * @param {NetworkType} [network='mainnet']
 * @returns {StacksAddress}
 */
export function createStacksAddress(address, network = 'mainnet') {
  const normalized = typeof address === 'string' ? address.trim().toUpperCase() : '';
  return {
    address: normalized,
    network,
    isValid: /^S[PTMN][A-Z0-9]{38,40}$/i.test(normalized),
  };
}

/**
 * @param {Partial<VaultConfig>} [config={}]
 * @returns {VaultConfig}
 */
export function normalizeVaultConfig(config = {}) {
  return {
    contractAddress: config.contractAddress ? String(config.contractAddress) : DEFAULT_PROTOCOL_CONFIG.contractAddress,
    contractName: config.contractName ? String(config.contractName) : DEFAULT_PROTOCOL_CONFIG.contractName,
    network: config.network || DEFAULT_PROTOCOL_CONFIG.network,
  };
}
