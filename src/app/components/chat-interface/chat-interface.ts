import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { Turn } from '../../models/game.model';

@Component({
  selector: 'app-chat-interface',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule],
  templateUrl: './chat-interface.html',
  styleUrl: './chat-interface.css',
})
export class ChatInterfaceComponent {
  @Input() turns: Turn[] = [];
  @Input() isLoading = false;
}
