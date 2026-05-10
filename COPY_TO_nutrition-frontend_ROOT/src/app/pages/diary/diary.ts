import {
  ChangeDetectorRef,
  Component,
  Inject,
  OnInit,
  PLATFORM_ID
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Auth, AuthUser } from '../../services/auth';
import { DiaryDay, DiaryService } from '../../services/diary';

@Component({
  selector: 'app-diary',
  imports: [CommonModule, FormsModule],
  templateUrl: './diary.html',
  styleUrl: './diary.css'
})
export class Diary implements OnInit {
  days: DiaryDay[] = [];
  loading = true;
  error = '';
  rangeDays = 7;
  currentUser: AuthUser | null;
  private readonly browser: boolean;

  constructor(
    private diaryService: DiaryService,
    private auth: Auth,
    private router: Router,
    private cdr: ChangeDetectorRef,
    @Inject(PLATFORM_ID) platformId: object
  ) {
    this.currentUser = this.auth.getCurrentUser();
    this.browser = isPlatformBrowser(platformId);
  }

  ngOnInit(): void {
    if (this.browser) {
      this.load(7);
    }
  }

  get initials(): string {
    return (this.currentUser?.fullName || 'U')
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part: string) => part[0].toUpperCase())
      .join('');
  }

  load(days: number): void {
    this.rangeDays = days;
    this.loading = true;
    this.error = '';

    const to = new Date();
    const from = new Date();
    from.setDate(to.getDate() - (days - 1));

    this.diaryService.getDiary(this.toIsoDate(from), this.toIsoDate(to)).subscribe({
      next: (entries) => {
        this.days = [...entries];
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (error) => {
        this.error = error?.error?.message || 'Could not load the diary.';
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  formatDate(date: string): string {
    const parsed = new Date(`${date}T12:00:00`);
    return new Intl.DateTimeFormat('en', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    }).format(parsed);
  }

  formatTime(date: string): string {
    return new Intl.DateTimeFormat('en', {
      hour: 'numeric',
      minute: '2-digit'
    }).format(new Date(date));
  }

  trackDay(_: number, day: DiaryDay): string {
    return day.date;
  }

  go(path: string): void {
    this.router.navigate([path]);
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/signin']);
  }

  private toIsoDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
