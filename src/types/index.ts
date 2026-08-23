
export type VipLevel = 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM' | 'DIAMOND' | 'ELITE';
export type UserRole = 'USER' | 'ADMIN' | 'SUPPORT';

export interface SharedUser {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  vipLevel: VipLevel;
  role: UserRole;
}

export interface SharedBet {
  id: string;
  userId: string;
  user?: SharedUser;
  game: string;
  wager: number;
  multiplier: number;
  profit: number;
  isWin: boolean;
  timestamp: string | Date;
}

export interface SharedTransaction {
  id: string;
  userId: string;
  amount: number;
  type: 'DEPOSIT' | 'WITHDRAW' | 'BET' | 'WIN' | 'BONUS' | 'COMMISSION';
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  description?: string;
  metadata?: Record<string, unknown>;
  createdAt: string | Date;
}

export interface GameResult {
  multiplier: number;
  profit: number;
  isWin: boolean;
  details?: Record<string, unknown>;
}

export interface BetResult {
  success: boolean;
  gameId: string;
  isWin: boolean;
  wager: number;
  multiplier: number;
  payout: number;
  nonce: number;
  result: Record<string, unknown>;
  serverSeed?: string;
  clientSeed?: string;
}

export interface SharedBetWithUser extends SharedBet {
  user: SharedUser;
}
