import { afterEach, describe, expect, it } from 'vitest';

import {
  createStacksAddress,
  formatAddress,
  formatLockPeriodDays,
  formatTokenAmount,
  getProtocolConfig,
  getProtocolVersion,
  initializeProtocol,
  normalizeVaultConfig,
  retry,
  validateStacksAddress,
  validateStacksAddressResult,
} from '../src/index.js';

afterEach(() => {
  initializeProtocol();
});

describe('Aegis SDK shared helpers', () => {
  it('formats addresses and lock periods', () => {
    expect(formatAddress('SP3FKNEZ86RG5RT7SZ5FBRGH85FZNG94ZH1MCGG6N')).toBe('SP3FKN...GG6N');
    expect(formatLockPeriodDays(7)).toBe('7 days');
    expect(formatTokenAmount('12.34567', 2)).toBe('12.35');
  });

  it('validates stacks addresses', () => {
    expect(validateStacksAddress('SP3FKNEZ86RG5RT7SZ5FBRGH85FZNG94ZH1MCGG6N')).toBe(true);
    expect(validateStacksAddress('bad-address')).toBe(false);
    expect(validateStacksAddressResult(' st1pqhqkv0rjxzfy1dgx8mnsnyve3vgzjsrtpgzgm ')).toEqual({
      valid: true,
      address: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
    });
  });

  it('retries asynchronous work', async () => {
    let attempts = 0;
    const result = await retry(async () => {
      attempts += 1;
      if (attempts < 2) {
        throw new Error('temporary');
      }
      return 'ok';
    }, 2);

    expect(result).toBe('ok');
    expect(attempts).toBe(2);
  });
});

describe('Aegis SDK protocol helpers', () => {
  it('initializes and reads protocol config', () => {
    const config = initializeProtocol({
      contractAddress: 'SP123',
      contractName: 'aegis-staking',
      network: 'testnet',
    });

    expect(config).toEqual({
      contractAddress: 'SP123',
      contractName: 'aegis-staking',
      network: 'testnet',
      version: '0.2.0',
    });
    expect(getProtocolVersion()).toBe('0.2.0');
    expect(getProtocolConfig()).toEqual(config);
  });

  it('creates and normalizes typed config values', () => {
    expect(createStacksAddress('SP3FKNEZ86RG5RT7SZ5FBRGH85FZNG94ZH1MCGG6N')).toEqual({
      address: 'SP3FKNEZ86RG5RT7SZ5FBRGH85FZNG94ZH1MCGG6N',
      network: 'mainnet',
      isValid: true,
    });

    expect(
      normalizeVaultConfig({
        contractAddress: 'SPABC',
        contractName: 'vault',
      })
    ).toEqual({
      contractAddress: 'SPABC',
      contractName: 'vault',
      network: 'mainnet',
    });
  });
});
