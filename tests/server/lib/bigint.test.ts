import { describe, it, expect } from 'vitest';
import {
  minorFromString,
  minorToString,
  isMinorString,
  formatMinor,
  humanToMinor,
  minorToHuman,
} from '../../../src/server/lib/bigint';

describe('minorFromString', () => {
  it('parses valid minor string', () => {
    expect(minorFromString('1000000')).toBe(1_000_000n);
    expect(minorFromString('0')).toBe(0n);
  });

  it('throws on invalid input', () => {
    expect(() => minorFromString('')).toThrow();
    expect(() => minorFromString('-1')).toThrow();
    expect(() => minorFromString('1.5')).toThrow();
    expect(() => minorFromString('abc')).toThrow();
  });
});

describe('minorToString', () => {
  it('converts bigint to string', () => {
    expect(minorToString(1_000_000n)).toBe('1000000');
    expect(minorToString(0n)).toBe('0');
  });
});

describe('isMinorString', () => {
  it('validates correctly', () => {
    expect(isMinorString('1000000')).toBe(true);
    expect(isMinorString('0')).toBe(true);
    expect(isMinorString('')).toBe(false);
    expect(isMinorString('-1')).toBe(false);
    expect(isMinorString('1.5')).toBe(false);
    expect(isMinorString(123)).toBe(false);
  });
});

describe('formatMinor', () => {
  it('formats 1 USDC correctly', () => {
    const result = formatMinor('1000000');
    expect(result).toContain('1');
  });

  it('formats with symbol', () => {
    const result = formatMinor('5000000', { symbol: '$' });
    expect(result).toContain('$');
    expect(result).toContain('5');
  });

  it('formats zero', () => {
    const result = formatMinor('0', { symbol: '$' });
    expect(result).toContain('0');
  });
});

describe('humanToMinor', () => {
  it('converts whole number', () => {
    expect(humanToMinor('5')).toBe('5000000');
    expect(humanToMinor('1')).toBe('1000000');
    expect(humanToMinor('100')).toBe('100000000');
  });

  it('converts decimal', () => {
    expect(humanToMinor('5.5')).toBe('5500000');
    expect(humanToMinor('0.50')).toBe('500000');
    expect(humanToMinor('1.123456')).toBe('1123456');
  });
});

describe('minorToHuman', () => {
  it('converts minor to human', () => {
    expect(minorToHuman('5000000')).toBe('5.000000');
    expect(minorToHuman('1000000')).toBe('1.000000');
    expect(minorToHuman('500000')).toBe('0.500000');
  });
});
