import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { Game } from '../../models/game.model';

@Component({
  selector: 'app-game-history-sidebar',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule, MatListModule],
  templateUrl: './game-history-sidebar.html',
  styleUrl: './game-history-sidebar.css',
})
export class GameHistorySidebarComponent {
  games = input<Game[]>([]);
  selectedGameId = input<string | null>(null);

  gameSelected = output<Game>();

  onGameClick(game: Game) {
    this.gameSelected.emit(game);
  }
}
