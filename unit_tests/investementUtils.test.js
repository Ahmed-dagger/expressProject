import { daysHeld, calculateGain, calculateROI, getROIStatement } from '../public/js/investmentUtils.js';

describe('investmentUtils', () => {
  const msPerDay = 1000 * 60 * 60 * 24;

  test('daysHeld: same day yields 0', () => {
    const d1 = new Date('2025-05-10');
    expect(daysHeld(d1, d1)).toBe(0);
  });

  test('daysHeld: one day difference', () => {
    const d1 = new Date('2025-05-10');
    const d2 = new Date(d1.getTime() + msPerDay);
    expect(daysHeld(d1, d2)).toBeCloseTo(1);
  });

  test('calculateGain: zero principal yields 0', () => {
    expect(calculateGain(0, 0.1, 10)).toBe(0);
  });

  test('calculateGain: simple 1-year gain', () => {
    // principal * rateDecimal * (days/365)
    expect(calculateGain(1000, 0.20, 365)).toBeCloseTo(200);
  });

  test('calculateROI: returns both days and gain (object + number)', () => {
  const start        = new Date('2025-01-01');
  const end          = new Date('2025-02-01');
  const expectedDays = 31;
  const expectedGain = 500 * 0.12 * (expectedDays / 365);

  const result = calculateROI(500, 0.12, start, end);

  // object matching
  expect(result).toEqual(
    expect.objectContaining({
      days: expect.any(Number),
      gain: expect.any(Number),
    })
  );

  // Number matching
  expect(result.days).toBeCloseTo(expectedDays, 5);
  expect(result.gain).toBeCloseTo(expectedGain, 5);
});

  test('formats positive gain to two decimals', () => {
    const interest = { gain: 123.456 };
    expect(getROIStatement(interest)).toBe('Accrued ROI: $123.46');
  });

});
