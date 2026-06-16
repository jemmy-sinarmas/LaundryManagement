import { describe, it, expect } from 'vitest';
import { formatIDR, formatDate, cn } from '@/lib/utils';

describe('formatIDR', () => {
  it('formats zero as a whole-rupiah currency string', () => {
    // Intl uses a non-breaking space between the symbol and the amount.
    expect(formatIDR(0).replace(/ /g, ' ')).toBe('Rp 0');
  });

  it('groups thousands and shows no fraction digits', () => {
    expect(formatIDR(1500000).replace(/ /g, ' ')).toBe('Rp 1.500.000');
  });

  it('formats negative amounts with a leading minus', () => {
    expect(formatIDR(-2500).replace(/ /g, ' ')).toBe('-Rp 2.500');
  });
});

describe('formatDate', () => {
  it('formats in Indonesian by default', () => {
    expect(formatDate('2026-06-15')).toBe('15 Juni 2026');
  });

  it('formats in English when lang=en', () => {
    expect(formatDate('2026-06-15', 'en')).toBe('15 June 2026');
  });
});

describe('cn', () => {
  it('joins truthy class names and drops falsy ones', () => {
    expect(cn('a', false, undefined, null, 'b')).toBe('a b');
  });

  it('returns an empty string when nothing is truthy', () => {
    expect(cn(false, undefined, null)).toBe('');
  });
});
