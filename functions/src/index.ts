import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'
import { processBetTransaction, processWinTransaction } from './walletEngine'

admin.initializeApp()
const db = admin.firestore()

// 1. 🎲 Dice Roll Function
export const processDiceRoll = functions.https.onCall(async (data, context) => {
  const uid = context.auth?.uid || data.uid || 'demo_user'
  const { stake, target, mode = 'under', requestId } = data

  if (!stake || stake <= 0 || target < 1 || target > 99 || !requestId) {
    throw new functions.https.HttpsError('invalid-argument', 'Invalid roll parameters')
  }

  const betResult = await processBetTransaction(db, uid, stake, 'dice', requestId)
  if (!betResult.success) {
    throw new functions.https.HttpsError('failed-precondition', betResult.error || 'Bet deduction failed')
  }

  const rollResult = Number(((Math.random() * 10000) / 100).toFixed(2))
  let won = false
  let winChance = 50

  if (mode === 'under') {
    won = rollResult < target
    winChance = target
  } else {
    won = rollResult > target
    winChance = 100 - target
  }

  const multiplier = won ? Number((99 / winChance).toFixed(2)) : 0
  const payout = won ? Number((stake * multiplier).toFixed(2)) : 0

  let finalBalance = betResult.balance
  if (won && payout > 0) {
    const winResult = await processWinTransaction(db, uid, payout, 'dice', requestId)
    if (winResult.success) {
      finalBalance = winResult.balance
    }
  }

  return {
    success: true,
    rollResult,
    won,
    multiplier,
    payout,
    balance: finalBalance,
    requestId,
  }
})

// 2. 💣 Mines Action Function
export const processMinesAction = functions.https.onCall(async (data, context) => {
  const uid = context.auth?.uid || data.uid || 'demo_user'
  const { action, stake, minesCount = 3, tileIndex, requestId } = data

  if (!action || !requestId) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing parameters')
  }

  if (action === 'start') {
    const betResult = await processBetTransaction(db, uid, stake, 'mines', requestId)
    if (!betResult.success) {
      throw new functions.https.HttpsError('failed-precondition', betResult.error || 'Bet failed')
    }

    return {
      success: true,
      action: 'start',
      balance: betResult.balance,
      minesCount,
      requestId,
    }
  }

  if (action === 'reveal') {
    const hitMine = Math.random() * 25 < minesCount
    const multiplier = hitMine ? 0 : Number((1 + (tileIndex % 5) * 0.4).toFixed(2))
    return {
      success: true,
      action: 'reveal',
      hitMine,
      tileIndex,
      multiplier,
    }
  }

  if (action === 'cashout') {
    const payout = Number(stake * (1 + minesCount * 0.35))
    const winResult = await processWinTransaction(db, uid, payout, 'mines', requestId)
    return {
      success: true,
      action: 'cashout',
      payout,
      balance: winResult.balance,
    }
  }

  throw new functions.https.HttpsError('unimplemented', 'Action not supported')
})

// 3. 💥 Crash Cashout Function
export const processCrashAction = functions.https.onCall(async (data, context) => {
  const uid = context.auth?.uid || data.uid || 'demo_user'
  const { action, stake, targetMultiplier = 2.0, requestId } = data

  if (action === 'bet') {
    const betResult = await processBetTransaction(db, uid, stake, 'crash', requestId)
    if (!betResult.success) {
      throw new functions.https.HttpsError('failed-precondition', betResult.error || 'Bet failed')
    }

    const randVal = Math.random()
    const crashPoint = Number(Math.min(100.0, Math.max(1.01, 0.99 / (1 - randVal * 0.95))).toFixed(2))

    return {
      success: true,
      action: 'bet',
      crashPoint,
      balance: betResult.balance,
      requestId,
    }
  }

  if (action === 'cashout') {
    const payout = Number((stake * targetMultiplier).toFixed(2))
    const winResult = await processWinTransaction(db, uid, payout, 'crash', requestId)
    return {
      success: true,
      action: 'cashout',
      multiplier: targetMultiplier,
      payout,
      balance: winResult.balance,
    }
  }

  throw new functions.https.HttpsError('invalid-argument', 'Invalid action')
})

// 4. 🎯 Plinko Drop Function
export const processPlinkoDrop = functions.https.onCall(async (data, context) => {
  const uid = context.auth?.uid || data.uid || 'demo_user'
  const { stake, requestId } = data

  const betResult = await processBetTransaction(db, uid, stake, 'plinko', requestId)
  if (!betResult.success) {
    throw new functions.https.HttpsError('failed-precondition', betResult.error || 'Bet failed')
  }

  const BUCKET_MULTIPLIERS = [100, 25, 9, 3, 1.5, 0.4, 0.2, 0.4, 1.5, 3, 9, 25, 100]
  let bucketIndex = 0
  for (let i = 0; i < 12; i++) {
    if (Math.random() > 0.5) bucketIndex++
  }

  const multiplier = BUCKET_MULTIPLIERS[bucketIndex] || 1.0
  const payout = Number((stake * multiplier).toFixed(2))

  let finalBalance = betResult.balance
  if (payout > 0) {
    const winResult = await processWinTransaction(db, uid, payout, 'plinko', requestId)
    if (winResult.success) finalBalance = winResult.balance
  }

  return {
    success: true,
    bucketIndex,
    multiplier,
    payout,
    balance: finalBalance,
    requestId,
  }
})

// 5. 🎡 Roulette Spin Function
export const processRouletteSpin = functions.https.onCall(async (data, context) => {
  const uid = context.auth?.uid || data.uid || 'demo_user'
  const { stake, betType, selectedValue, requestId } = data

  const betResult = await processBetTransaction(db, uid, stake, 'roulette', requestId)
  if (!betResult.success) {
    throw new functions.https.HttpsError('failed-precondition', betResult.error || 'Bet failed')
  }

  const winningPocket = Math.floor(Math.random() * 37)
  const RED_NUMBERS = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36]

  let won = false
  let multiplier = 0

  if (betType === 'RED') {
    won = RED_NUMBERS.includes(winningPocket)
    multiplier = won ? 2.0 : 0
  } else if (betType === 'BLACK') {
    won = winningPocket !== 0 && !RED_NUMBERS.includes(winningPocket)
    multiplier = won ? 2.0 : 0
  } else if (betType === 'NUMBER') {
    won = winningPocket === Number(selectedValue)
    multiplier = won ? 36.0 : 0
  }

  const payout = Number((stake * multiplier).toFixed(2))
  let finalBalance = betResult.balance

  if (won && payout > 0) {
    const winResult = await processWinTransaction(db, uid, payout, 'roulette', requestId)
    if (winResult.success) finalBalance = winResult.balance
  }

  return {
    success: true,
    winningPocket,
    won,
    multiplier,
    payout,
    balance: finalBalance,
    requestId,
  }
})

// 6. 🎰 Slots Spin Function
export const processSlotSpin = functions.https.onCall(async (data, context) => {
  const uid = context.auth?.uid || data.uid || 'demo_user'
  const { stake, requestId } = data

  const betResult = await processBetTransaction(db, uid, stake, 'slots', requestId)
  if (!betResult.success) {
    throw new functions.https.HttpsError('failed-precondition', betResult.error || 'Bet failed')
  }

  const SYMBOLS = ['7️⃣', '💎', '🔔', '🍒', '🍋', '🍇']
  const reel1 = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]
  const reel2 = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]
  const reel3 = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]
  const reels = [reel1, reel2, reel3]

  let multiplier = 0
  if (reel1 === reel2 && reel2 === reel3) {
    multiplier = reel1 === '7️⃣' ? 25.0 : (reel1 === '💎' ? 15.0 : 10.0)
  } else if (reel1 === reel2 || reel2 === reel3 || reel1 === reel3) {
    multiplier = 1.5
  }

  const payout = Number((stake * multiplier).toFixed(2))
  let finalBalance = betResult.balance

  if (multiplier > 0) {
    const winResult = await processWinTransaction(db, uid, payout, 'slots', requestId)
    if (winResult.success) finalBalance = winResult.balance
  }

  return {
    success: true,
    reels,
    won: multiplier > 0,
    multiplier,
    payout,
    balance: finalBalance,
    requestId,
  }
})

// 7. 🪙 Coinflip Flip Function
export const processCoinflip = functions.https.onCall(async (data, context) => {
  const uid = context.auth?.uid || data.uid || 'demo_user'
  const { stake, choice = 'heads', requestId } = data

  const betResult = await processBetTransaction(db, uid, stake, 'coinflip', requestId)
  if (!betResult.success) {
    throw new functions.https.HttpsError('failed-precondition', betResult.error || 'Bet failed')
  }

  const outcome = Math.random() > 0.5 ? 'heads' : 'tails'
  const won = outcome === choice.toLowerCase()
  const multiplier = won ? 1.95 : 0
  const payout = won ? Number((stake * multiplier).toFixed(2)) : 0

  let finalBalance = betResult.balance
  if (won && payout > 0) {
    const winResult = await processWinTransaction(db, uid, payout, 'coinflip', requestId)
    if (winResult.success) finalBalance = winResult.balance
  }

  return {
    success: true,
    outcome,
    won,
    multiplier,
    payout,
    balance: finalBalance,
    requestId,
  }
})

// 8. ⚽ Penalty Shootout Function
export const processPenaltyShoot = functions.https.onCall(async (data, context) => {
  const uid = context.auth?.uid || data.uid || 'demo_user'
  const { stake, targetZone = 1, requestId } = data

  const betResult = await processBetTransaction(db, uid, stake, 'penalty', requestId)
  if (!betResult.success) {
    throw new functions.https.HttpsError('failed-precondition', betResult.error || 'Bet failed')
  }

  const keeperDiveZone = Math.floor(Math.random() * 6) + 1
  const scoredGoal = keeperDiveZone !== targetZone
  const ZONE_MULTIPLIERS: Record<number, number> = { 1: 2.0, 2: 1.8, 3: 2.0, 4: 3.5, 5: 4.8, 6: 3.5 }

  const multiplier = scoredGoal ? (ZONE_MULTIPLIERS[targetZone] || 2.0) : 0
  const payout = scoredGoal ? Number((stake * multiplier).toFixed(2)) : 0

  let finalBalance = betResult.balance
  if (scoredGoal && payout > 0) {
    const winResult = await processWinTransaction(db, uid, payout, 'penalty', requestId)
    if (winResult.success) finalBalance = winResult.balance
  }

  return {
    success: true,
    targetZone,
    keeperDiveZone,
    scoredGoal,
    multiplier,
    payout,
    balance: finalBalance,
    requestId,
  }
})

// 9. 🔮 Sphere Lottery Function
export const processLotteryTicket = functions.https.onCall(async (data, context) => {
  const uid = context.auth?.uid || data.uid || 'demo_user'
  const { stake = 10, mode = '4digit', chosenNumbers = [1, 2, 3, 4], requestId } = data

  const betResult = await processBetTransaction(db, uid, stake, 'lottery', requestId)
  if (!betResult.success) {
    throw new functions.https.HttpsError('failed-precondition', betResult.error || 'Ticket purchase failed')
  }

  const totalBalls = mode === 'mega' ? 6 : 4
  const maxVal = mode === 'mega' ? 49 : 9
  const winningBalls: number[] = []

  while (winningBalls.length < totalBalls) {
    const randBall = Math.floor(Math.random() * (maxVal + 1))
    if (!winningBalls.includes(randBall)) winningBalls.push(randBall)
  }

  const matchCount = chosenNumbers.filter((n: number) => winningBalls.includes(n)).length
  const multiplier = matchCount === totalBalls ? (mode === 'mega' ? 2000.0 : 500.0) : (matchCount > 1 ? 5.0 : 0)
  const payout = Number((stake * multiplier).toFixed(2))

  let finalBalance = betResult.balance
  if (payout > 0) {
    const winResult = await processWinTransaction(db, uid, payout, 'lottery', requestId)
    if (winResult.success) finalBalance = winResult.balance
  }

  return {
    success: true,
    winningBalls,
    matchCount,
    multiplier,
    payout,
    balance: finalBalance,
    requestId,
  }
})
