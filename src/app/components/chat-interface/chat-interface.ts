import {
  Component,
  Input,
  ElementRef,
  ViewChild,
  AfterViewChecked,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
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
export class ChatInterfaceComponent implements OnChanges, AfterViewChecked {
  @Input() turns: Turn[] = [];
  @Input() isLoading = false;

  @ViewChild('chatMessages') private chatMessagesRef!: ElementRef<HTMLDivElement>;

  private shouldScrollToBottom = false;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['turns'] || changes['isLoading']) {
      this.shouldScrollToBottom = true;
    }
  }

  ngAfterViewChecked(): void {
    if (this.shouldScrollToBottom) {
      this.scrollToBottom();
      this.shouldScrollToBottom = false;
    }
  }

  private scrollToBottom(): void {
    if (this.chatMessagesRef?.nativeElement) {
      const element = this.chatMessagesRef.nativeElement;
      element.scrollTop = element.scrollHeight;
    }
  }
}
