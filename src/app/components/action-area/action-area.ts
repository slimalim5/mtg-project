import { Component, EventEmitter, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-action-area',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSlideToggleModule,
    MatIconModule,
  ],
  templateUrl: './action-area.html',
  styleUrl: './action-area.css',
})
export class ActionAreaComponent {
  @Output() questionSubmitted = new EventEmitter<string>();
  @Output() guessSubmitted = new EventEmitter<string>();

  userInput = '';
  isGuessMode = signal(false);

  onSubmit() {
    if (!this.userInput.trim()) return;

    if (this.isGuessMode()) {
      this.guessSubmitted.emit(this.userInput);
    } else {
      this.questionSubmitted.emit(this.userInput);
    }

    this.userInput = '';
  }

  onModeToggle(checked: boolean) {
    this.isGuessMode.set(checked);
  }
}
