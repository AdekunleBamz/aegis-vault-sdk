import { STX_DECIMALS } from './constants.js';

function assertNonNegativeBigInt(value, fieldName) {
  if (typeof value !== 'bigint' || value < 0n) {
    throw new Error(`${fieldName} must be a non-negative bigint.`);
  }
}

export function stxToMicroStx(amountSTX) {
  const raw = String(amountSTX).trim();
  if (!/^\d+(\.\d+)?$/.test(raw)) {
    throw new Error('amountSTX must be a positive number string, number, or bigint.');
  }

  const [whole, fraction = ''] = raw.split('.');
  if (fraction.length > STX_DECIMALS) {
    throw new Error(`amountSTX supports at most ${STX_DECIMALS} decimal places.`);
  }

  const micros =
    BigInt(whole) * 10n ** BigInt(STX_DECIMALS) +
    BigInt((fraction + '0'.repeat(STX_DECIMALS)).slice(0, STX_DECIMALS));

  return micros;
}

export function microStxToStx(amountMicroStx) {
  const value = typeof amountMicroStx === 'bigint' ? amountMicroStx : BigInt(amountMicroStx);
  assertNonNegativeBigInt(value, 'amountMicroStx');
  const divisor = 10n ** BigInt(STX_DECIMALS);
  const whole = value / divisor;
  const fraction = (value % divisor).toString().padStart(STX_DECIMALS, '0');
  return `${whole.toString()}.${fraction}`;
}

export function formatStx(amountMicroStx, maxFractionDigits = 6) {
  const raw = microStxToStx(amountMicroStx);
  const [whole, fraction] = raw.split('.');
  const trimmed = fraction.replace(/0+$/, '').slice(0, maxFractionDigits);
  return trimmed.length ? `${whole}.${trimmed}` : whole;
}

export function formatPercent(value, fractionDigits = 2) {
  const n = Number(value);
  if (!Number.isFinite(n)) {
    throw new Error('value must be a finite number.');
  }
  return `${n.toFixed(fractionDigits)}%`;
}
