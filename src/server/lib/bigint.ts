import { AppError } from './http';

const MINOR_RE = /^[0-9]+$/;

function assertMinorString(value: string, fieldName: string): void {
  if (typeof value !== 'string' || !MINOR_RE.test(value) || value.length === 0) {
    throw new AppError(
      'INVALID_INPUT',
      `${fieldName} must be a non-negative integer string (minor units)`,
      400,
    );
  }
}

export function minorFromString(value: string, fieldName = 'amount'): bigint {
  assertMinorString(value, fieldName);
  return BigInt(value);
}

export function minorToString(value: bigint): string {
  return value.toString();
}

export function isMinorString(value: unknown): value is string {
  return typeof value === 'string' && MINOR_RE.test(value) && value.length > 0;
}

export function formatMinor(
  value: string,
  opts: { decimals?: number; symbol?: string; locale?: string } = {},
): string {
  const decimals = opts.decimals ?? 6;
  const symbol = opts.symbol ?? '';
  const locale = opts.locale ?? 'en-US';
  const big = minorFromString(value);
  const negative = big < 0n;
  const abs = negative ? -big : big;
  const padded = abs.toString().padStart(decimals, '0');
  const whole = padded.slice(0, padded.length - decimals) || '0';
  const fraction = decimals > 0 ? padded.slice(padded.length - decimals) : '';
  const formatted = new Intl.NumberFormat(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(Number(`${whole}.${fraction || '0'}`));
  return `${negative ? '-' : ''}${symbol}${formatted}`;
}

/** Convert a human amount string like "5.5" to Stellar seven-decimal units "55000000" */
export function humanToMinor(human: string, decimals = 7): string {
  const parts = human.trim().split('.');
  const whole = parts[0] ?? '0';
  const fraction = (parts[1] ?? '').padEnd(decimals, '0').slice(0, decimals);
  const result = BigInt(whole) * BigInt(10 ** decimals) + BigInt(fraction);
  return result.toString();
}

/** Convert minor units string to human-readable decimal string */
export function minorToHuman(minor: string, decimals = 7): string {
  const big = minorFromString(minor);
  const divisor = BigInt(10 ** decimals);
  const whole = big / divisor;
  const frac = big % divisor;
  return `${whole}.${frac.toString().padStart(decimals, '0')}`;
}
