import { Timestamp } from '@angular/fire/firestore';

export interface SecretCardData {
  name: string;
  mana_cost: string;
  type_line: string;
  oracle_text: string;
}

export interface Turn {
  id?: string;
  question: string;
  answer: string;
  type: 'question' | 'guess';
  timestamp: Timestamp;
}

export interface Game {
  id?: string;
  status: 'active' | 'won' | 'lost';
  startedAt: Timestamp;
  secretCardData: SecretCardData;
}
