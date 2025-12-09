import { Injectable, inject } from '@angular/core';
import { CardService } from './card.service';
import {
  Firestore,
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  Timestamp
} from '@angular/fire/firestore';
import { Game, Turn, SecretCardData } from '../models/game.model';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class GameService {
  private firestore = inject(Firestore);
  private cardService = inject(CardService);
  cardData: SecretCardData | null = null;

  // Mock card data for testing
  // private mockCard: SecretCardData = {
  //   name: 'Lightning Bolt',
  //   mana_cost: '{R}',
  //   type_line: 'Instant',
  //   oracle_text: 'Deal 3 damage to any target.'
  // };

  async loadCard() {
    this.cardService.getRandomCard().subscribe(data => {
      console.log(data);
      this.cardData = data;
    });
  }

  async createGame(userId: string): Promise<string> {
    const gamesRef = collection(this.firestore, `users/${userId}/games`);


    const newGame: Omit<Game, 'id'> = {
      status: 'active',
      startedAt: Timestamp.now(),
      secretCardData: this.cardData,
    };

    const docRef = await addDoc(gamesRef, newGame);
    return docRef.id;
  }

  async getActiveGame(userId: string): Promise<Game | null> {
    const gamesRef = collection(this.firestore, `users/${userId}/games`);
    const q = query(gamesRef, where('status', '==', 'active'), limit(1));

    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return null;
    }

    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() } as Game;
  }

  async getGameHistory(userId: string, limitCount: number = 10): Promise<Game[]> {
    const gamesRef = collection(this.firestore, `users/${userId}/games`);
    const q = query(
      gamesRef,
      where('status', 'in', ['won', 'lost']),
      orderBy('startedAt', 'desc'),
      limit(limitCount)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Game);
  }

  // Turn operations (subcollection)
  async addTurn(userId: string, gameId: string, turn: Omit<Turn, 'id' | 'timestamp'>): Promise<string> {
    const turnsRef = collection(this.firestore, `users/${userId}/games/${gameId}/turns`);

    const newTurn = {
      ...turn,
      timestamp: Timestamp.now()
    };

    const docRef = await addDoc(turnsRef, newTurn);
    return docRef.id;
  }

  async getTurns(userId: string, gameId: string): Promise<Turn[]> {
    const turnsRef = collection(this.firestore, `users/${userId}/games/${gameId}/turns`);
    const q = query(turnsRef, orderBy('timestamp', 'asc'));

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Turn);
  }
}
