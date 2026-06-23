import { PACK_PRICE } from '../math/RTPModel';
import { EventBus } from '../../managers/EventBus';

export interface Transaction {
  type: 'deposit' | 'pack_purchase' | 'card_win' | 'pack_win';
  amount: number;
  balanceAfter: number;
  timestamp: number;
}

export interface SessionStats {
  totalWagered: number;
  totalWon: number;
  packsOpened: number;
  sessionRTP: number;
}

export class EconomyManager {
  private _balance: number;
  private _history: Transaction[] = [];
  private _totalWagered = 0;
  private _totalWon = 0;
  private _packsOpened = 0;

  constructor(initialBalance = 100) {
    this._balance = initialBalance;
  }

  get balance(): number { return this._balance; }
  get history(): Readonly<Transaction[]> { return this._history; }
  get sessionStats(): SessionStats {
    return {
      totalWagered: this._totalWagered,
      totalWon: this._totalWon,
      packsOpened: this._packsOpened,
      sessionRTP: this._totalWagered > 0 ? this._totalWon / this._totalWagered : 0,
    };
  }

  deposit(amount: number): void {
    if (amount <= 0) throw new Error('Deposit must be positive');
    this._balance += amount;
    this.record('deposit', amount);
    EventBus.emit('balance:changed', this._balance);
  }

  canAffordPack(): boolean {
    return this._balance >= PACK_PRICE;
  }

  buyPack(): void {
    if (!this.canAffordPack()) throw new Error('Insufficient balance');
    this._balance -= PACK_PRICE;
    this._totalWagered += PACK_PRICE;
    this._packsOpened++;
    this.record('pack_purchase', -PACK_PRICE);
    EventBus.emit('balance:changed', this._balance);
  }

  awardCard(amount: number): void {
    if (amount < 0) return;
    this._balance += amount;
    this._totalWon += amount;
    this.record('card_win', amount);
    EventBus.emit('balance:changed', this._balance);
  }

  private record(type: Transaction['type'], amount: number): void {
    this._history.push({ type, amount, balanceAfter: this._balance, timestamp: Date.now() });
  }
}
