import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { cvToHex, responseOkCV, uintCV } from '@stacks/transactions';

import { AegisVaultClient, LOCK_PERIOD_DAYS, stxToMicroStx } from '../src/index.js';

describe('AegisVaultClient', () => {
  let originalFetch;

  beforeEach(() => {
    originalFetch = global.fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('initializes with mainnet defaults', () => {
    const client = new AegisVaultClient();
    expect(client.network).toBe('mainnet');
    expect(client.getContractId('staking')).toBe(
      'SP3FKNEZ86RG5RT7SZ5FBRGH85FZNG94ZH1MCGG6N.aegis-staking-v2-15'
    );
    expect(LOCK_PERIOD_DAYS).toEqual([3, 7, 30]);
  });

  it('builds stake transaction options', () => {
    const client = new AegisVaultClient();
    const options = client.buildStakeTxOptions(stxToMicroStx('1.5'), 7, 'SP3FKNEZ86RG5RT7SZ5FBRGH85FZNG94ZH1MCGG6N');

    expect(options.functionName).toBe('stake');
    expect(options.functionArgs).toHaveLength(2);
    expect(options.postConditionMode).toBeDefined();
  });

  it('throws on invalid lock period', () => {
    const client = new AegisVaultClient();
    expect(() => client.buildStakeTxOptions(1_000_000n, 5)).toThrow(/lockPeriodDays/i);
  });

  it('decodes read-only call response', async () => {
    const client = new AegisVaultClient();
    const payload = {
      okay: true,
      result: cvToHex(responseOkCV(uintCV(123n))),
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => payload,
      text: async () => '',
    });

    const result = await client.getUserTotalStaked('SP3FKNEZ86RG5RT7SZ5FBRGH85FZNG94ZH1MCGG6N');

    expect(result).toBe(123n);
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });
});
