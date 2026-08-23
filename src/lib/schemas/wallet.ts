
import { z } from "zod"
import { PaymentMethod } from "@prisma/client"

export const depositSchema = z.object({
  amount: z.number().positive().min(100, "Minimum deposit is 100").max(500000, "Maximum deposit is 500,000"),
  method: z.nativeEnum(PaymentMethod),
})

export const withdrawalSchema = z.object({
  amount: z.number().positive().min(500, "Minimum withdrawal is 500").max(50000, "Maximum withdrawal is 50,000"),
  method: z.nativeEnum(PaymentMethod),
  details: z.object({
    bankName: z.string().optional(),
    accountNumber: z.string().optional(),
    ifscCode: z.string().regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, "Invalid IFSC Code").optional(),
    upiId: z.string().regex(/^[\w.-]+@[\w.-]+$/, "Invalid UPI ID").optional(),
    cryptoAddress: z.string().optional(),
  }).refine((data) => {
    // Ensure at least one valid detail is present based on logic (simplified here)
    return !!(data.upiId || (data.accountNumber && data.ifscCode) || data.cryptoAddress)
  }, { message: "Payment details required" })
})

export type DepositInput = z.infer<typeof depositSchema>
export type WithdrawalInput = z.infer<typeof withdrawalSchema>
