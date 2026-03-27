import { STACKS_MAINNET, STACKS_TESTNET } from '@stacks/network';
import {
  ClarityType,
  PostConditionMode,
  cvToHex,
  cvToValue,
  hexToCV,
  principalCV,
  uintCV,
} from '@stacks/transactions';

import {
  API_BASE_URLS,
  DEFAULT_CONTRACTS_BY_NETWORK,
  DEFAULT_DEPLOYER_BY_NETWORK,
  LOCK_PERIOD_DAYS,
  NETWORKS,
} from './constants.js';
import { stxToMicroStx } from './format.js';

function assertNetwork(network) {
  if (!NETWORKS.includes(network)) {
    throw new Error(`Invalid network "${String(network)}". Use "mainnet" or "testnet".`);
  }
}

function assertPositiveUintLike(value, fieldName) {
  const n = typeof value === 'bigint' ? value : BigInt(value);
  if (n <= 0n) {
    throw new Error(`${fieldName} must be greater than 0.`);
  }
  return n;
}

function assertUintLike(value, fieldName) {
  const n = typeof value === 'bigint' ? value : BigInt(value);
  if (n < 0n) {
    throw new Error(`${fieldName} must be >= 0.`);
  }
  return n;
}

function normalizeContracts(baseContracts, overrides = {}) {
  return {
    ...baseContracts,
    ...overrides,
  };
}

function decodeReadOnlyResult(resultHex) {
  const cv = hexToCV(resultHex);

  if (cv.type === ClarityType.ResponseErr) {
    const errValue = cvToValue(cv.value);
    throw new Error(`Contract returned err: ${JSON.stringify(errValue)}`);
  }

  if (cv.type === ClarityType.ResponseOk) {
    return cvToValue(cv.value);
  }

  return cvToValue(cv);
}

export class AegisVaultClient {
  constructor(options = {}) {
    const network = options.network ?? 'mainnet';
    assertNetwork(network);

    this.network = network;
    this.apiBaseUrl = options.apiBaseUrl ?? API_BASE_URLS[network];
    this.deployerAddress = options.deployerAddress ?? DEFAULT_DEPLOYER_BY_NETWORK[network];
    this.contracts = normalizeContracts(DEFAULT_CONTRACTS_BY_NETWORK[network], options.contracts);
    this.stacksNetwork = network === 'mainnet' ? STACKS_MAINNET : STACKS_TESTNET;
  }

  getContractId(contractKey) {
    const contractName = this.contracts[contractKey];
    if (!contractName) {
      throw new Error(`Unknown contract key "${contractKey}".`);
    }
    return `${this.deployerAddress}.${contractName}`;
  }

  getContractParts(contractKey) {
    const contractName = this.contracts[contractKey];
    if (!contractName) {
      throw new Error(`Unknown contract key "${contractKey}".`);
    }
    return [this.deployerAddress, contractName];
  }

  async getCurrentBlockHeight() {
    const response = await fetch(`${this.apiBaseUrl}/v2/info`);
    if (!response.ok) {
      throw new Error(`Failed to fetch chain info (${response.status}).`);
    }
    const data = await response.json();
    return data.stacks_tip_height;
  }

  async getAccountBalance(address) {
    if (!address || typeof address !== 'string') {
      throw new Error('address is required.');
    }

    const response = await fetch(`${this.apiBaseUrl}/v2/accounts/${address}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch account balance (${response.status}).`);
    }

    return response.json();
  }

  async getAccountTransactions(address, limit = 20) {
    if (!address || typeof address !== 'string') {
      throw new Error('address is required.');
    }

    const response = await fetch(
      `${this.apiBaseUrl}/extended/v1/address/${address}/transactions?limit=${limit}`
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch account transactions (${response.status}).`);
    }

    const data = await response.json();
    return data.results;
  }

  async callReadOnly(contractKey, functionName, args = [], options = {}) {
    const [contractAddress, contractName] = this.getContractParts(contractKey);
    const senderAddress = options.senderAddress ?? contractAddress;

    const argumentHex = args.map(arg => {
      if (typeof arg === 'string' && arg.startsWith('0x')) {
        return arg;
      }
      return cvToHex(arg);
    });

    const response = await fetch(
      `${this.apiBaseUrl}/v2/contracts/call-read/${contractAddress}/${contractName}/${functionName}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sender: senderAddress,
          arguments: argumentHex,
        }),
      }
    );

    if (!response.ok) {
      const reason = await response.text();
      throw new Error(
        `Read-only call failed (${response.status}) for ${contractName}.${functionName}: ${reason}`
      );
    }

    const payload = await response.json();
    if (!payload.okay) {
      throw new Error(`Read-only call returned not okay for ${contractName}.${functionName}.`);
    }

    return decodeReadOnlyResult(payload.result);
  }

  async getStake(staker, stakeId) {
    return this.callReadOnly('staking', 'get-stake', [principalCV(staker), uintCV(assertUintLike(stakeId, 'stakeId'))]);
  }

  async getUserStakeIds(userAddress) {
    return this.callReadOnly('staking', 'get-user-stake-ids', [principalCV(userAddress)]);
  }

  async getUserTotalStaked(userAddress) {
    return this.callReadOnly('staking', 'get-user-total-staked', [principalCV(userAddress)]);
  }

  async isStakeUnlocked(staker, stakeId) {
    return this.callReadOnly('staking', 'is-stake-unlocked', [principalCV(staker), uintCV(assertUintLike(stakeId, 'stakeId'))]);
  }

  async getUnlockBlock(staker, stakeId) {
    return this.callReadOnly('staking', 'get-unlock-block', [principalCV(staker), uintCV(assertUintLike(stakeId, 'stakeId'))]);
  }

  async getStakingVaultStats() {
    return this.callReadOnly('staking', 'get-vault-stats');
  }

  async getPendingRewards(staker, stakeId) {
    return this.callReadOnly('rewards', 'get-pending-rewards', [principalCV(staker), uintCV(assertUintLike(stakeId, 'stakeId'))]);
  }

  async getRewardsStats() {
    return this.callReadOnly('rewards', 'get-rewards-stats');
  }

  async getTokenBalance(account) {
    return this.callReadOnly('token', 'get-balance', [principalCV(account)]);
  }

  async getTokenMetadata() {
    const [name, symbol, decimals, totalSupply] = await Promise.all([
      this.callReadOnly('token', 'get-name'),
      this.callReadOnly('token', 'get-symbol'),
      this.callReadOnly('token', 'get-decimals'),
      this.callReadOnly('token', 'get-total-supply'),
    ]);

    return { name, symbol, decimals, totalSupply };
  }

  buildStakeTxOptions(amountMicroStx, lockPeriodDays, senderAddress) {
    const amount = assertPositiveUintLike(amountMicroStx, 'amountMicroStx');
    const lockPeriod = assertPositiveUintLike(lockPeriodDays, 'lockPeriodDays');

    if (!LOCK_PERIOD_DAYS.includes(Number(lockPeriod))) {
      throw new Error(`lockPeriodDays must be one of: ${LOCK_PERIOD_DAYS.join(', ')}.`);
    }

    const [contractAddress, contractName] = this.getContractParts('staking');

    return {
      network: this.stacksNetwork,
      contractAddress,
      contractName,
      functionName: 'stake',
      functionArgs: [uintCV(amount), uintCV(lockPeriod)],
      // Kept permissive for compatibility across stacks.js versions.
      // Consumers can provide custom post-conditions in their app-layer wallet call.
      postConditionMode: PostConditionMode.Allow,
      senderAddress,
    };
  }

  buildStakeTxOptionsFromStx(amountSTX, lockPeriodDays, senderAddress) {
    return this.buildStakeTxOptions(stxToMicroStx(amountSTX), lockPeriodDays, senderAddress);
  }

  buildClaimRewardsTxOptions(stakeId) {
    const [contractAddress, contractName] = this.getContractParts('rewards');

    return {
      network: this.stacksNetwork,
      contractAddress,
      contractName,
      functionName: 'claim-rewards-direct',
      functionArgs: [uintCV(assertUintLike(stakeId, 'stakeId'))],
      postConditionMode: PostConditionMode.Allow,
    };
  }

  buildRequestWithdrawalTxOptions(stakeId) {
    const [contractAddress, contractName] = this.getContractParts('vault');

    return {
      network: this.stacksNetwork,
      contractAddress,
      contractName,
      functionName: 'request-withdrawal',
      functionArgs: [uintCV(assertUintLike(stakeId, 'stakeId'))],
      postConditionMode: PostConditionMode.Allow,
    };
  }

  buildCompleteWithdrawalTxOptions() {
    const [contractAddress, contractName] = this.getContractParts('vault');

    return {
      network: this.stacksNetwork,
      contractAddress,
      contractName,
      functionName: 'complete-withdrawal',
      functionArgs: [],
      postConditionMode: PostConditionMode.Allow,
    };
  }

  buildEmergencyWithdrawTxOptions(stakeId) {
    const [contractAddress, contractName] = this.getContractParts('vault');

    return {
      network: this.stacksNetwork,
      contractAddress,
      contractName,
      functionName: 'emergency-withdraw',
      functionArgs: [uintCV(assertUintLike(stakeId, 'stakeId'))],
      postConditionMode: PostConditionMode.Allow,
    };
  }
}
