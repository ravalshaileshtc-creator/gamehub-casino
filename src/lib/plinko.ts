
/**
 * Plinko Logic
 * 
 * Standard implementation:
 * - Rows: 8 to 16
 * - Risk: Low, Medium, High
 * - Multipliers calculated based on standard probability distribution (Pascal's triangle)
 */

export type PlinkoRisk = 'LOW' | 'MEDIUM' | 'HIGH';

export const PLINKO_ROWS_MIN = 8;
export const PLINKO_ROWS_MAX = 16;

// Pre-calculated multipliers for fair gaming (simplified for this implementation)
// In a real production app, these must be mathematically rigorous to ensure House Edge
export const MULTIPLIERS: Record<PlinkoRisk, Record<number, number[]>> = {
  LOW: {
    8: [5.6, 2.1, 1.1, 1, 0.5, 1, 1.1, 2.1, 5.6],
    16: [16, 9, 2, 1.4, 1.4, 1.2, 1.1, 1, 0.5, 1, 1.1, 1.2, 1.4, 1.4, 2, 9, 16]
  },
  MEDIUM: {
    8: [13, 3, 1.3, 0.7, 0.4, 0.7, 1.3, 3, 13],
    16: [110, 41, 10, 5, 3, 1.5, 1, 0.5, 0.3, 0.5, 1, 1.5, 3, 5, 10, 41, 110]
  },
  HIGH: {
    8: [29, 4, 1.5, 0.3, 0.2, 0.3, 1.5, 4, 29],
    16: [1000, 130, 26, 9, 4, 2, 0.2, 0.2, 0.2, 0.2, 0.2, 2, 4, 9, 26, 130, 1000]
  }
};

// Fallback generator if specific row count isn't hardcoded above
export function getMultipliers(rows: number, risk: PlinkoRisk): number[] {
  // Check if we have exact match
  if (MULTIPLIERS[risk][rows]) {
    return MULTIPLIERS[risk][rows];
  }

  // Generate plausible looking multipliers for other row counts (Placeholder logic)
  // This is just to prevent crashes if user selects 12 rows etc.
  // In a real money game, EVERY row configuration needs exact math.
  const count = rows + 1;
  const result = new Array(count).fill(0);
  const mid = Math.floor(count / 2);

  for (let i = 0; i < count; i++) {
    const dist = Math.abs(i - mid);
    // Higher distance = higher multiplier
    const val = 0.5 + Math.pow(dist, risk === 'HIGH' ? 2.5 : risk === 'MEDIUM' ? 2 : 1.5) / 2;
    // Clamp/Round
    result[i] = Math.round(val * 10) / 10;
    if (i === mid) result[i] = 0.5; // Center is loss usually
  }
  return result;
}
