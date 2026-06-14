import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Auth, AuthUser } from '../../services/auth';
import { MealResponse, MealsService } from '../../services/meal';
import { PostsService, SocialPost } from '../../services/posts';
import { fileToCompressedDataUrl } from '../../utils/image';

@Component({
  selector: 'app-posts',
  imports: [CommonModule, FormsModule],
  templateUrl: './posts.html',
  styleUrl: './posts.css'
})
export class Posts implements OnInit {
  feed: SocialPost[] = [];
  meals: MealResponse[] = [];
  caption = '';
  imageUrl: string | null = null;
  mealEntryId: number | null = null;
  loading = true;
  posting = false;
  message = '';
  error = '';
  commentDrafts: Record<number, string> = {};
  currentUser: AuthUser | null;

  constructor(
    private postsService: PostsService,
    private mealsService: MealsService,
    private auth: Auth,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {
    this.currentUser = this.auth.getCurrentUser();
  }

  ngOnInit(): void {
    this.load();

    this.mealsService.getMeals().subscribe({
      next: (meals) => {
        this.meals = [...meals];
        this.cdr.markForCheck();
      },
      error: () => {
        this.meals = [];
        this.cdr.markForCheck();
      }
    });
  }

  get initials(): string {
    return (this.currentUser?.fullName || 'U')
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part: string) => part[0].toUpperCase())
      .join('');
  }

  load(): void {
    this.loading = true;
    this.error = '';
    this.cdr.markForCheck();

    this.postsService.feed().subscribe({
      next: (posts) => {
        this.feed = [...posts];
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (error) => {
        this.error = error?.error?.message || 'Could not load posts.';
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  async onImage(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) {
      return;
    }

    try {
      this.imageUrl = await fileToCompressedDataUrl(file, 1100, 0.78);
    } catch (error) {
      this.error = error instanceof Error
        ? error.message
        : 'Could not process image.';
    } finally {
      input.value = '';
      this.cdr.markForCheck();
    }
  }

  create(): void {
    this.message = '';
    this.error = '';

    if (!this.caption.trim()) {
      this.error = 'Write a caption before posting.';
      this.cdr.markForCheck();
      return;
    }

    this.posting = true;
    this.cdr.markForCheck();

    this.postsService
      .create(this.caption.trim(), this.imageUrl, this.mealEntryId)
      .subscribe({
        next: (post) => {
          this.feed = [post, ...this.feed];
          this.caption = '';
          this.imageUrl = null;
          this.mealEntryId = null;
          this.message = 'Post shared with your friends.';
          this.posting = false;
          this.cdr.markForCheck();
        },
        error: (error) => {
          this.error = error?.error?.message || 'Could not create post.';
          this.posting = false;
          this.cdr.markForCheck();
        }
      });
  }

  like(post: SocialPost): void {
    this.postsService.toggleLike(post.id).subscribe({
      next: (updated) => {
        this.feed = this.feed.map((item) =>
          item.id === updated.id ? updated : item
        );
        this.cdr.markForCheck();
      },
      error: (error) => {
        this.error = error?.error?.message || 'Could not like post.';
        this.cdr.markForCheck();
      }
    });
  }

  comment(post: SocialPost): void {
    const content = (this.commentDrafts[post.id] || '').trim();

    if (!content) {
      return;
    }

    this.postsService.addComment(post.id, content).subscribe({
      next: (comment) => {
        this.feed = this.feed.map((item) => {
          if (item.id !== post.id) {
            return item;
          }

          return {
            ...item,
            comments: [...item.comments, comment],
            commentsCount: item.commentsCount + 1
          };
        });

        this.commentDrafts = {
          ...this.commentDrafts,
          [post.id]: ''
        };

        this.cdr.markForCheck();
      },
      error: (error) => {
        this.error = error?.error?.message || 'Could not add comment.';
        this.cdr.markForCheck();
      }
    });
  }

  remove(post: SocialPost): void {
    if (!confirm('Delete this post?')) {
      return;
    }

    this.postsService.delete(post.id).subscribe({
      next: () => {
        this.feed = this.feed.filter((item) => item.id !== post.id);
        this.cdr.markForCheck();
      },
      error: (error) => {
        this.error = error?.error?.message || 'Could not delete post.';
        this.cdr.markForCheck();
      }
    });
  }

  own(post: SocialPost): boolean {
    return post.author.id === this.currentUser?.id;
  }

  avatarText(name: string): string {
    return name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part: string) => part[0].toUpperCase())
      .join('');
  }

  time(date: string): string {
    const diff = Date.now() - new Date(date).getTime();
    const minutes = Math.max(1, Math.floor(diff / 60000));

    if (minutes < 60) {
      return `${minutes}m ago`;
    }

    const hours = Math.floor(minutes / 60);
    if (hours < 24) {
      return `${hours}h ago`;
    }

    return `${Math.floor(hours / 24)}d ago`;
  }

  go(path: string): void {
    this.router.navigate([path]);
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/signin']);
  }
}
