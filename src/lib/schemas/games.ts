
import { z } from "zod"
import { PLINKO_ROWS_MIN, PLINKO_ROWS_MAX } from "@/lib/plinko"

// Common Schemas
export const wagerSchema = z.number().positive().min(1).max(100000)
export const clientSeedSchema = z.string().min(1).optional()

// Plinko Schemas
export const plinkoRiskSchema = z.enum(["LOW", "MEDIUM", "HIGH"])

export const plinkoBetSchema = z.object({
  wager: wagerSchema,
  rows: z.number().int().min(PLINKO_ROWS_MIN).max(PLINKO_ROWS_MAX),
  risk: plinkoRiskSchema,
  clientSeed: clientSeedSchema
})

export type PlinkoBetInput = z.infer<typeof plinkoBetSchema>
