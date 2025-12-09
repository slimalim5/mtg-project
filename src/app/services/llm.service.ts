import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { OpenAI } from 'openai';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class LlmService {
  
  private client = new OpenAI({
    apiKey: environment.openai.apiKey,
    // This is dangerous, and were this going to be a production app, this would need to be false, and the ai call would need to happen in Firebase
    dangerouslyAllowBrowser: true,
  })
  http = inject(HttpClient);

  constructor() { }
}
