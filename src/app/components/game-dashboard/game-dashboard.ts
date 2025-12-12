import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { GameService } from '../../services/game.service';
import { CardService } from '../../services/card.service';
import { LlmService } from '../../services/llm.service';
import { SecretCardData } from '../../models/game.model';

@Component({
  selector: 'app-game-dashboard',
  standalone: true,
  imports: [
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatListModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './game-dashboard.html',
  styleUrl: './game-dashboard.css'
})
export class GameDashboardComponent {
  gameService = inject(GameService);
  cardService = inject(CardService);
  llmService = inject(LlmService);

  currentCard = signal<SecretCardData | null>(null);
  question = signal('');
  answer = signal('');
  loading = signal(false);
  error = signal('');

  getRandomCard() {
    console.log('========== getRandomCard() clicked ==========');
    this.loading.set(true);
    this.error.set('');
    this.answer.set('');

    this.cardService.getRandomCard().subscribe({
      next: (card) => {
        console.log('✓ Card received from Scryfall:', card.name);
        console.log('Card details:', {
          name: card.name,
          type: card.type_line,
          cmc: card.cmc,
          rarity: card.rarity,
          set: card.set_name
        });
        console.log('Full card object:', card);
        console.log('Has card_faces?', !!card.card_faces);
        console.log('card_faces:', card.card_faces);
        this.currentCard.set(card);
        console.log('currentCard set to:', this.currentCard());
        console.log('UI should now show card info');
        this.loading.set(false);
      },
      error: (err) => {
        console.error('✗ Failed to fetch card:', err);
        console.error('Error details:', {
          message: err.message,
          status: err.status,
          statusText: err.statusText
        });
        this.error.set('Failed to fetch card: ' + err.message);
        this.loading.set(false);
      }
    });
  }

  askQuestion() {
    console.log('========== askQuestion() clicked ==========');
    const card = this.currentCard();
    const questionText = this.question();

    if (!card || !questionText.trim()) {
      console.warn('⚠ Missing card or question');
      this.error.set('Please select a card and enter a question');
      return;
    }

    console.log('Question:', questionText);
    console.log('Current card:', card.name);

    this.loading.set(true);
    this.error.set('');
    this.answer.set('');

    this.llmService.answerQuestion(questionText, card).subscribe({
      next: (response) => {
        console.log('✓ Response received from Firebase function');
        console.log('AI Answer:', response.response);
        console.log('Token usage:', response.usage);
        this.answer.set(response.response);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('✗ Failed to get answer from Firebase function:', err);
        console.error('Error details:', {
          message: err.message,
          status: err.status,
          statusText: err.statusText,
          error: err.error
        });
        this.error.set('Failed to get answer: ' + err.message);
        this.loading.set(false);
      }
    });
  }
}