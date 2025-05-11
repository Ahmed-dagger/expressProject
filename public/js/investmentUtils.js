export function daysHeld(startDate, endDate) {
  const msPerDay = 1000 * 60 * 60 * 24;
  return (endDate - startDate) / msPerDay;
}

export function calculateGain(principal, annualRateDecimal, daysHeld) {
  return principal * annualRateDecimal * (daysHeld / 365);
}

export function calculateROI(principal, annualRateDecimal, startDate, endDate) {
  const d = daysHeld(startDate, endDate);
  return {
    days: d,
    gain: calculateGain(principal, annualRateDecimal, d)
  };
}

export function getROIStatement(interest) {
  return `Accrued ROI: $${interest.gain.toFixed(2)}`
}
