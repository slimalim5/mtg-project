import { Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-game-dashboard',
  standalone: true,
  imports: [MatCardModule, MatButtonModule, MatListModule, MatIconModule],
  templateUrl: './game-dashboard.html',
  styleUrl: './game-dashboard.css'
})
export class GameDashboardComponent {}