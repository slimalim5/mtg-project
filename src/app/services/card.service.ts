import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { SecretCardData } from '../models/game.model';

@Injectable({
  providedIn: 'root',
})
export class CardService {
  private http = inject(HttpClient);

  getRandomCard(): Observable<SecretCardData> {
    return this.http.get<SecretCardData>('https://api.scryfall.com/cards/random');
  }
}