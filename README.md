# Aegis Vault SDK

Official JavaScript SDK for integrating with Aegis Vault contracts on Stacks.

## Install

```bash
npm install aegis-vault-sdk
```

## Quick Start

```js
import { AegisVaultClient, formatStx } from 'aegis-vault-sdk';

const sdk = new AegisVaultClient({ network: 'mainnet' });

const stats = await sdk.getStakingVaultStats();
console.log('Total staked (uSTX):', stats['total-staked']);

const token = await sdk.getTokenMetadata();
console.log(token.name, token.symbol, token.decimals);

const stakeTx = sdk.buildStakeTxOptionsFromStx('10', 7, 'SP123...YOUR_ADDRESS');
console.log(stakeTx.functionName, stakeTx.functionArgs);
```

## Integrated Helpers

The SDK now includes the shared helpers that used to live in the separate
`aegis-vault-types`, `aegis-vault-utils`, and lightweight protocol package.

```js
import {
  createStacksAddress,
  formatAddress,
  getProtocolConfig,
  validateStacksAddress,
} from 'aegis-vault-sdk';

const protocol = getProtocolConfig();
const wallet = createStacksAddress('SP3FKNEZ86RG5RT7SZ5FBRGH85FZNG94ZH1MCGG6N');
const shortAddress = formatAddress(wallet.address);
const isValid = validateStacksAddress(wallet.address);
```

## What the SDK includes

- Read-only helpers:
  - `getStake`
  - `getUserStakeIds`
  - `getUserTotalStaked`
  - `isStakeUnlocked`
  - `getUnlockBlock`
  - `getStakingVaultStats`
  - `getPendingRewards`
  - `getRewardsStats`
  - `getTokenBalance`
  - `getTokenMetadata`
- Transaction option builders:
  - `buildStakeTxOptions`
  - `buildStakeTxOptionsFromStx`
  - `buildClaimRewardsTxOptions`
  - `buildRequestWithdrawalTxOptions`
  - `buildCompleteWithdrawalTxOptions`
  - `buildEmergencyWithdrawTxOptions`
- Shared utilities:
  - `formatAddress`
  - `validateStacksAddress`
  - `validateStacksAddressResult`
  - `formatTokenAmount`
  - `formatLockPeriodDays`
  - `retry`
- Protocol helpers:
  - `initializeProtocol`
  - `getProtocolVersion`
  - `getProtocolConfig`
  - `createStacksAddress`
  - `normalizeVaultConfig`

## Build and Test

```bash
npm install
npm run build
npm test
```

## Publish

```bash
npm publish --access public
```

## Track npm downloads

```bash
npm view aegis-vault-sdk version
curl https://api.npmjs.org/downloads/point/last-month/aegis-vault-sdk
```

Note: npm download stats are delayed (often 24-72 hours for new packages).

## License

MIT
