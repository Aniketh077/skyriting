/**
 * Format price in Indian Rupees (INR)
 * @param price - Price in USD (will be converted to INR) 
 * @returns Formatted price string with ₹ symbol
 */
export const formatINR = (price: number): string => {
  // Convert USD to INR (approximately 83 INR = 1 USD as of 2025)
  const inrPrice = price * 83;
  
  // Format with Indian numbering system (lakhs, crores)
  return `₹${inrPrice.toLocaleString('en-IN', { 
    maximumFractionDigits: 0,
    minimumFractionDigits: 0
  })}`;
};

/**
 * Format price range for filters
 */
export const formatPriceRange = (min: number, max?: number): string => {
  if (!max) {
    return `Under ${formatINR(min)}`;
  }
  return `${formatINR(min)} - ${formatINR(max)}`;
};
