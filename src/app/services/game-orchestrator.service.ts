import { Injectable, inject } from '@angular/core';
import { Observable, firstValueFrom } from 'rxjs';
import { CardService } from './card.service';
import { GameService } from './game.service';
import { AuthService } from './auth';
import { LlmService } from './llm.service';
import { SecretCardData } from '../models/game.model';

@Injectable({
  providedIn: 'root',
})
export class GameOrchestratorService {
  private cardService = inject(CardService);
  private gameService = inject(GameService);
  private authService = inject(AuthService);
  private llmService = inject(LlmService);

  /**
   * Starts a new game by:
   * 1. Fetching a random card from Scryfall
   * 2. Creating a new game document in Firestore with the card data
   * @returns Promise<string> The ID of the newly created game
   */
  async startGame(): Promise<string> {
    console.log('[Orchestrator] startGame called');

    // Get current user
    console.log('[Orchestrator] Getting current user...');
    const user = await firstValueFrom(this.authService.user$);
    if (!user) {
      throw new Error('User must be authenticated to start a game');
    }
    console.log('[Orchestrator] User authenticated:', user.uid);

    // Fetch random card from Scryfall
    console.log('[Orchestrator] Fetching random card from Scryfall...');
    const cardData = await firstValueFrom(this.cardService.getRandomCard());
    console.log('[Orchestrator] Card fetched:', cardData.name);

    // Store the card data in GameService for reference
    this.gameService.cardData = cardData;

    // Create new game in Firestore
    console.log('[Orchestrator] Creating game in Firestore...');
    const gameId = await this.gameService.createGame(user.uid);
    console.log('[Orchestrator] Game created with ID:', gameId);

    return gameId;
  }

  /**
   * Submits a question to the LLM and records the turn
   * @param gameId The ID of the active game
   * @param question The user's question
   * @returns Promise<string> The LLM's answer
   */
  async submitQuestion(gameId: string, question: string): Promise<string> {
    // Get current user
    const user = await firstValueFrom(this.authService.user$);
    if (!user) {
      throw new Error('User must be authenticated to submit a question');
    }

    // Get the active game to retrieve secret card data
    const game = await this.gameService.getActiveGame(user.uid);
    if (!game || game.id !== gameId) {
      throw new Error('Game not found or not active');
    }

    if (!game.secretCardData) {
      throw new Error('Game has no secret card data');
    }

    // Get answer from LLM
    const answer = await this.llmService.answerQuestion(question, game.secretCardData);

    // Record the turn in Firestore
    await this.gameService.addTurn(user.uid, gameId, {
      question,
      answer,
      type: 'question',
    });

    return answer;
  }

  /**
   * Submits a guess and checks if it matches the secret card
   * @param gameId The ID of the active game
   * @param guess The user's guess for the card name
   * @returns Promise<boolean> True if guess is correct
   */
  async submitGuess(gameId: string, guess: string): Promise<boolean> {
    // Get current user
    const user = await firstValueFrom(this.authService.user$);
    if (!user) {
      throw new Error('User must be authenticated to submit a guess');
    }

    // Get the active game to retrieve secret card data
    const game = await this.gameService.getActiveGame(user.uid);
    if (!game || game.id !== gameId) {
      throw new Error('Game not found or not active');
    }

    if (!game.secretCardData) {
      throw new Error('Game has no secret card data');
    }

    // Normalize strings for comparison (case-insensitive, trimmed)
    const normalizedGuess = guess.trim().toLowerCase();
    const normalizedCardName = game.secretCardData.name.trim().toLowerCase();

    // Check if guess is correct
    const isCorrect = normalizedGuess === normalizedCardName;

    // Prepare answer message
    const answer = isCorrect
      ? `Yes! The card is ${game.secretCardData.name}. You won!`
      : `No, it's not ${guess}. The card was ${game.secretCardData.name}. You lost!`;

    // Record the guess as a turn
    await this.gameService.addTurn(user.uid, gameId, {
      question: `Is the card ${guess}?`,
      answer,
      type: 'guess',
    });

    // Update game status
    const status = isCorrect ? 'won' : 'lost';
    await this.gameService.updateGameStatus(user.uid, gameId, status);

    return isCorrect;
  }
}
