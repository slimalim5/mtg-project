import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { SecretCardData } from '../models/game.model';

interface AskQuestionResponse {
  response: string;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class LlmService {
  private http = inject(HttpClient);
  private functionUrl = 'https://us-central1-mtg20-58a58.cloudfunctions.net/askQuestion';

  answerQuestion(question: string, card: SecretCardData): Observable<AskQuestionResponse> {
    console.log('========== LlmService.answerQuestion() ==========');
    console.log('Question:', question);
    console.log('Card:', card.name);
    console.log('Firebase Function URL:', this.functionUrl);

    const payload = {
      secretCardData: card,
      message: question
    };

    console.log('Request payload:', JSON.stringify({
      message: payload.message,
      cardName: payload.secretCardData.name,
      cardType: payload.secretCardData.type_line
    }, null, 2));

    console.log('Sending POST request to Firebase function...');

    return this.http.post<AskQuestionResponse>(this.functionUrl, payload);
  }
}
