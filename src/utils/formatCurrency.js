/**
 * Indian Rupee (INR) currency formatting utilities
 * Uses the Indian numbering system (Crores / Lakhs)
 */

export function formatINR(amount, options = {}) {
  const num = Number(amount) || 0;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: options.fractionDigits ?? 0,
    minimumFractionDigits: options.fractionDigits ?? 0,
  }).format(num);
}

/**
 * Format currency with Indian abbreviations (Cr for Crores, L for Lakhs)
 * e.g., ₹58.17 Cr, ₹1.25 Cr, ₹89.0 L
 */
export function formatINRAbbreviated(amount, decimals = 2) {
  const num = Number(amount) || 0;
  if (Math.abs(num) >= 10000000) {
    const cr = (num / 10000000).toFixed(decimals);
    return `₹${cr} Cr`;
  }
  if (Math.abs(num) >= 100000) {
    const l = (num / 100000).toFixed(decimals > 1 ? 1 : decimals);
    return `₹${l} L`;
  }
  if (Math.abs(num) >= 1000) {
    const k = (num / 1000).toFixed(1);
    return `₹${k} K`;
  }
  return formatINR(num);
}

/**
 * Splitting value for headline display with muted paise
 */
export function formatINRPieces(amount) {
  const num = Number(amount) || 0;
  const formatted = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);

  const parts = formatted.split('.');
  return {
    whole: parts[0] || '₹0',
    paise: parts[1] || '00',
  };
}

export default formatINR;
