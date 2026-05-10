import { ChangeDetectorRef, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NutritionAiService } from '../../services/ai';

type ChatMessage = {
  role: 'assistant' | 'user';
  text: string;
};

@Component({
  selector: 'app-nutrition-chat',
  imports: [CommonModule, FormsModule],
  templateUrl: './nutrition-chat.html',
  styleUrl: './nutrition-chat.css'
})
export class NutritionChat {
  messages: ChatMessage[] = [
    {
      role: 'assistant',
      text: 'How can we help you? Ask a general question about meals, nutrition, hydration, or healthy habits.'
    }
  ];

  question = '';
  loading = false;
  error = '';
  disclaimer = 'General nutrition information only.';

  readonly quickQuestions = [
    'Suggest a balanced breakfast',
    'How can I add more protein?',
    'Recommend a healthy snack'
  ];

  constructor(
    private aiService: NutritionAiService,
    private cdr: ChangeDetectorRef
  ) {}

  useQuickQuestion(question: string): void {
    this.question = question;
    this.send();
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.send();
    }
  }

  send(): void {
    const message = this.question.trim();

    if (!message || this.loading) {
      return;
    }

    this.error = '';
    this.messages = [...this.messages, { role: 'user', text: message }];
    this.question = '';
    this.loading = true;
    this.cdr.markForCheck();

    this.aiService.ask(message).subscribe({
      next: (response) => {
        this.messages = [
          ...this.messages,
          { role: 'assistant', text: response.answer }
        ];
        this.disclaimer = response.disclaimer;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (error) => {
        this.error = error?.error?.message ||
          'The nutrition assistant is unavailable right now. Please try again.';
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }
}
