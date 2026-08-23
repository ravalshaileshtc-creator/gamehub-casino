
import crypto from 'crypto'

export class ProvablyFairService {
  /**
   * Generate a new Server Seed
   * This should be kept secret until the game is over (or seed is rotated)
   */
  static generateServerSeed(): string {
    return crypto.randomBytes(32).toString('hex')
  }

  /**
   * Generate a new Client Seed
   * Default client seed for new users
   */
  static generateClientSeed(): string {
    return crypto.randomBytes(8).toString('hex')
  }

  /**
   * Hash the Server Seed
   * This is what we show to the user *before* the game
   */
  static hashServerSeed(serverSeed: string): string {
    return crypto.createHash('sha256').update(serverSeed).digest('hex')
  }

  /**
   * Calculate HMAC_SHA256
   * core of provably fair: hmac(serverSeed, clientSeed:nonce)
   */
  static calculateHmac(serverSeed: string, clientSeed: string, nonce: number): string {
    const message = `${clientSeed}:${nonce}`
    return crypto.createHmac('sha256', serverSeed).update(message).digest('hex')
  }

  /**
   * Generate a uniform float 0..1 from HMAC
   */
  static generateOutcome(serverSeed: string, clientSeed: string, nonce: number): number {
    const hash = this.calculateHmac(serverSeed, clientSeed, nonce)
    const h = parseInt(hash.slice(0, 13), 16)
    const e = Math.pow(2, 52)
    return h / e
  }

  static outcomeToDice(outcome: number): number {
    // 0.00 to 100.00
    return Math.floor(outcome * 10001) / 100
  }

  static outcomeToCoinFlip(outcome: number): 'HEADS' | 'TAILS' {
    return Math.floor(outcome * 2) === 0 ? 'HEADS' : 'TAILS'
  }

  static outcomeToRoulette(outcome: number): number {
    return Math.floor(outcome * 37) // 0-36
  }

  static outcomeToCrashMultiplier(outcome: number): number {
    // Instant crash check (1% chance usually, or derived from hash)
    // For simplicity with float input, we follow standard formula:
    // M = 0.99 / (1 - X)
    const multiplier = 0.99 / (1 - outcome)
    return Math.max(1.00, Math.floor(multiplier * 100) / 100)
  }

  static outcomeToPlinko(serverSeed: string, clientSeed: string, nonce: number, rows: number): number {
    // Returns bucket index 0..rows
    const path = this.calculatePlinkoPath(serverSeed, clientSeed, nonce, rows)
    return path.reduce((a, b) => a + b, 0)
  }

  static outcomeToMines(serverSeed: string, clientSeed: string, nonce: number, mineCount: number): number[] {
    // Create array 0..24
    const deck = Array.from({ length: 25 }, (_, i) => i)

    // Fisher-Yates shuffle using hash


    // Simple seeded shuffle
    // In production, use more of the hash bytes for better distribution
    for (let i = deck.length - 1; i > 0; i--) {
      // Re-hashing is better.
      // For this demo:
      const h2 = parseInt(this.calculateHmac(serverSeed, clientSeed, nonce + i), 16)
      const swapIdx = h2 % (i + 1)
        ;[deck[i], deck[swapIdx]] = [deck[swapIdx], deck[i]]
    }

    return deck.slice(0, mineCount)
  }

  static outcomeToSlots(serverSeed: string, clientSeed: string, nonce: number): number[] {
    const hash = this.calculateHmac(serverSeed, clientSeed, nonce)
    // 3 reels, symbols 0-9
    const r1 = parseInt(hash.slice(0, 2), 16) % 10
    const r2 = parseInt(hash.slice(2, 4), 16) % 10
    const r3 = parseInt(hash.slice(4, 6), 16) % 10
    return [r1, r2, r3]
  }

  /**
   * Verify an outcome against a hash
   */
  static verifyOutcome(serverSeed: string, clientSeed: string, nonce: number, outcome: number): boolean {
    // Re-calculate based on what we expect 'outcome' to be. 
    // This depends on the game. 
    // If outcome is the float 0-1:
    const generated = this.generateOutcome(serverSeed, clientSeed, nonce)
    return Math.abs(generated - outcome) < 0.000001
  }

  /**
   * Crash Point Calculation (Original)
   * Kept for reference or backward compatibility
   */
  static calculateCrashPoint(serverSeed: string, clientSeed: string, nonce: number): number {
    const hash = this.calculateHmac(serverSeed, clientSeed, nonce)
    const h = parseInt(hash.slice(0, 13), 16)
    const e = Math.pow(2, 52)
    if (h % 33 === 0) return 1.00
    const result = Math.floor((100 * e - h) / (e - h)) / 100
    return Math.max(1.00, result)
  }

  /**
   * Plinko Path Calculation (Original)
   */
  static calculatePlinkoPath(serverSeed: string, clientSeed: string, nonce: number, rows: number): number[] {
    const hash = this.calculateHmac(serverSeed, clientSeed, nonce)

    // We need 'rows' number of bits/decisions
    // We can just use the hex string, convert to binary, or take groups

    const path: number[] = []

    // Simple implementation: 
    // Take chunks of hex characters, convert to int, mod 2
    // If we need more randomness than one hash provides, we might need to expand.
    // SHA256 is 256 bits. 16 rows needs 16 bits. Plenty.

    // Let's convert hash to a sequence of integers
    // We can take pairs of hex chars (1 byte) -> 0-255 -> mod 2?
    // Determine direction for each row

    for (let i = 0; i < rows; i++) {
      // Use 2 hex chars per row (0-255)
      // i*2 because 2 chars per byte
      const sub = hash.slice(i * 2, (i * 2) + 2)
      const val = parseInt(sub, 16)

      // 0 = Left, 1 = Right
      // 0.5 probability?
      const direction = val % 2 === 0 ? 0 : 1
      path.push(direction)
    }

    return path
  }
}
