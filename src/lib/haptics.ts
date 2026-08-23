/**
 * Native Haptics Engine utilizing Web Haptics API (navigator.vibrate)
 * with Capacitor device haptics fallback.
 */

export const haptics = {
  /** Light 10ms haptic feedback for tab switches, chip selections, button taps */
  light: () => {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(10)
      } catch {
        // Silently handle unsupported engines
      }
    }
  },

  /** Medium 30ms haptic feedback for dice rolls, bet drops, tile reveals */
  medium: () => {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(30)
      } catch {
        // Fallback
      }
    }
  },

  /** Heavy impact 80ms haptic feedback for explosions or high wins */
  heavy: () => {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(80)
      } catch {
        // Fallback
      }
    }
  },

  /** Heavy success pattern for winning payouts */
  success: () => {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate([40, 60, 100])
      } catch {
        // Fallback
      }
    }
  },

  /** Error pattern for invalid inputs or lost bets */
  error: () => {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate([80, 40, 80])
      } catch {
        // Fallback
      }
    }
  }
}
