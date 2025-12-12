import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatBadgeModule } from '@angular/material/badge';
import { CommonModule } from '@angular/common';
import { firstValueFrom } from 'rxjs';
import { GameService } from '../../services/game.service';
import { GameOrchestratorService } from '../../services/game-orchestrator.service';
import { AuthService } from '../../services/auth';
import { Game, Turn } from '../../models/game.model';
import { ChatInterfaceComponent } from '../chat-interface/chat-interface';
import { ActionAreaComponent } from '../action-area/action-area';

@Component({
  selector: 'app-game-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatListModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatBadgeModule,
    ChatInterfaceComponent,
    ActionAreaComponent,
  ],
  templateUrl: './game-dashboard.html',
  styleUrl: './game-dashboard.css',
})
export class GameDashboardComponent implements OnInit {
  private gameService = inject(GameService);
  private orchestrator = inject(GameOrchestratorService);
  private authService = inject(AuthService);

  activeGame = signal<Game | null>(null);
  turns = signal<Turn[]>([]);
  isLoading = signal(false);
  isSubmitting = signal(false);
  error = signal<string | null>(null);

  // Computed signal to count questions (not guesses)
  questionCount = computed(() => {
    return this.turns().filter((turn) => turn.type === 'question').length;
  });

  async ngOnInit() {
    await this.loadActiveGame();
  }

  async loadActiveGame() {
    try {
      const user = await firstValueFrom(this.authService.user$);
      if (!user) return;

      const game = await this.gameService.getActiveGame(user.uid);
      this.activeGame.set(game);

      // Load turns if game is active
      if (game?.id) {
        await this.loadTurns(user.uid, game.id);
      }
    } catch (err) {
      console.error('Error loading active game:', err);
      this.error.set('Failed to load active game');
    }
  }

  async loadTurns(userId: string, gameId: string) {
    try {
      const turns = await this.gameService.getTurns(userId, gameId);
      this.turns.set(turns);
    } catch (err) {
      console.error('Error loading turns:', err);
    }
  }

  async onStartGame() {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      console.log('[GameDashboard] Starting new game...');
      const gameId = await this.orchestrator.startGame();
      console.log('[GameDashboard] Game started with ID:', gameId);

      // Reload active game to get the full game object
      console.log('[GameDashboard] Loading active game...');
      await this.loadActiveGame();
      console.log('[GameDashboard] Active game loaded successfully');
    } catch (err: any) {
      console.error('[GameDashboard] Error starting game:', err);
      console.error('[GameDashboard] Error message:', err?.message);
      console.error('[GameDashboard] Error stack:', err?.stack);
      this.error.set(`Failed to start game: ${err?.message || 'Unknown error'}. Please try again.`);
    } finally {
      this.isLoading.set(false);
    }
  }

  onBackToDashboard() {
    // Clear active game and return to welcome screen
    this.activeGame.set(null);
    this.turns.set([]);
    this.error.set(null);
    console.log('[GameDashboard] Returned to dashboard');
  }

  async onQuestionSubmitted(question: string) {
    const game = this.activeGame();
    if (!game?.id) return;

    this.isSubmitting.set(true);
    this.error.set(null);

    try {
      const user = await firstValueFrom(this.authService.user$);
      if (!user) return;

      // Submit question to orchestrator
      await this.orchestrator.submitQuestion(game.id, question);

      // Reload turns to show the new Q&A
      await this.loadTurns(user.uid, game.id);
    } catch (err) {
      console.error('Error submitting question:', err);
      this.error.set('Failed to submit question. Please try again.');
    } finally {
      this.isSubmitting.set(false);
    }
  }

  async onGuessSubmitted(guess: string) {
    const game = this.activeGame();
    if (!game?.id) return;

    this.isSubmitting.set(true);
    this.error.set(null);

    try {
      const user = await firstValueFrom(this.authService.user$);
      if (!user) return;

      // Submit guess to orchestrator
      const isCorrect = await this.orchestrator.submitGuess(game.id, guess);

      // Reload turns to show the guess result
      await this.loadTurns(user.uid, game.id);

      // Update game status locally (don't reload from DB, as it won't be 'active' anymore)
      const updatedGame = { ...game, status: isCorrect ? 'won' : 'lost' } as Game;
      this.activeGame.set(updatedGame);
    } catch (err) {
      console.error('Error submitting guess:', err);
      this.error.set('Failed to submit guess. Please try again.');
    } finally {
      this.isSubmitting.set(false);
    }
  }
}