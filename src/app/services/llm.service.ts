import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { OpenAI } from 'openai';
import { environment } from '../../environments/environment';
import { SecretCardData } from '../models/game.model';

@Injectable({
  providedIn: 'root'
})
export class LlmService {
  
  answerQuestion(question: string, card: SecretCardData) {
    
  }

  constructor() { }
}
