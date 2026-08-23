import * as admin from 'firebase-admin'

export interface WalletTransactionResult {
  success: boolean
  balance: number
  transactionId: string
  error?: string
}

export async function processBetTransaction(
  db: admin.firestore.Firestore,
  uid: string,
  stake: number,
  gameId: string,
  requestId: string
): Promise<WalletTransactionResult> {
  const transactionRef = db.collection('walletTransactions').doc(requestId)
  const walletRef = db.collection('wallets').doc(uid)

  try {
    return await db.runTransaction(async (transaction) => {
      // 1. Idempotency Check
      const existingTx = await transaction.get(transactionRef)
      if (existingTx.exists) {
        const data = existingTx.data()
        return {
          success: true,
          balance: data?.balanceAfter || 0,
          transactionId: requestId,
        }
      }

      // 2. Read Wallet
      const walletDoc = await transaction.get(walletRef)
      let currentBalance = 10000.0 // Default demo wallet balance

      if (walletDoc.exists) {
        currentBalance = walletDoc.data()?.balance ?? 10000.0
      } else {
        transaction.set(walletRef, {
          uid,
          balance: 10000.0,
          lockedBalance: 0,
          currency: 'USD',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
      }

      if (currentBalance < stake) {
        throw new Error('INSUFFICIENT_FUNDS')
      }

      const newBalance = currentBalance - stake
      const timestamp = new Date().toISOString()

      // 3. Update Wallet Balance
      transaction.update(walletRef, {
        balance: newBalance,
        updatedAt: timestamp,
      })

      // 4. Create Immutable Ledger Entry
      transaction.set(transactionRef, {
        id: requestId,
        uid,
        type: 'BET',
        amount: stake,
        balanceAfter: newBalance,
        currency: 'USD',
        status: 'COMPLETED',
        gameId,
        createdAt: timestamp,
      })

      return {
        success: true,
        balance: newBalance,
        transactionId: requestId,
      }
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'BET_FAILED'
    return {
      success: false,
      balance: 0,
      transactionId: requestId,
      error: message,
    }
  }
}

export async function processWinTransaction(
  db: admin.firestore.Firestore,
  uid: string,
  payout: number,
  gameId: string,
  requestId: string
): Promise<WalletTransactionResult> {
  const transactionRef = db.collection('walletTransactions').doc(`${requestId}_win`)
  const walletRef = db.collection('wallets').doc(uid)

  try {
    return await db.runTransaction(async (transaction) => {
      const existingTx = await transaction.get(transactionRef)
      if (existingTx.exists) {
        const data = existingTx.data()
        return {
          success: true,
          balance: data?.balanceAfter || 0,
          transactionId: `${requestId}_win`,
        }
      }

      const walletDoc = await transaction.get(walletRef)
      const currentBalance = walletDoc.exists ? walletDoc.data()?.balance ?? 10000.0 : 10000.0
      const newBalance = currentBalance + payout
      const timestamp = new Date().toISOString()

      transaction.set(
        walletRef,
        {
          uid,
          balance: newBalance,
          updatedAt: timestamp,
        },
        { merge: true }
      )

      transaction.set(transactionRef, {
        id: `${requestId}_win`,
        uid,
        type: 'WIN',
        amount: payout,
        balanceAfter: newBalance,
        currency: 'USD',
        status: 'COMPLETED',
        gameId,
        createdAt: timestamp,
      })

      return {
        success: true,
        balance: newBalance,
        transactionId: `${requestId}_win`,
      }
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'WIN_FAILED'
    return {
      success: false,
      balance: 0,
      transactionId: requestId,
      error: message,
    }
  }
}
