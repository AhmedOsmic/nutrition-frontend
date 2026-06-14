import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { Auth, AuthUser } from '../../services/auth';
import {
  FriendRequest,
  FriendsService,
  PublicUser
} from '../../services/friends';

@Component({
  selector: 'app-friends',
  imports: [CommonModule, FormsModule],
  templateUrl: './friends.html',
  styleUrl: './friends.css'
})
export class Friends implements OnInit {
  friends: PublicUser[] = [];
  incoming: FriendRequest[] = [];
  outgoing: FriendRequest[] = [];
  suggestions: PublicUser[] = [];
  results: PublicUser[] = [];

  query = '';
  loading = true;
  message = '';
  error = '';
  activeTab: 'friends' | 'requests' | 'suggestions' = 'requests';
  currentUser: AuthUser | null;

  constructor(
    private friendsService: FriendsService,
    private auth: Auth,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {
    this.currentUser = this.auth.getCurrentUser();
  }

  ngOnInit(): void {
    this.reload();
  }

  get initials(): string {
    return (this.currentUser?.fullName || 'U')
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part: string) => part[0].toUpperCase())
      .join('');
  }

  reload(): void {
    this.loading = true;
    this.error = '';
    this.cdr.markForCheck();

    forkJoin({
      friends: this.friendsService.getFriends(),
      incoming: this.friendsService.incoming(),
      outgoing: this.friendsService.outgoing(),
      suggestions: this.friendsService.suggestions()
    }).subscribe({
      next: (data) => {
        this.friends = [...data.friends];
        this.incoming = [...data.incoming];
        this.outgoing = [...data.outgoing];
        this.suggestions = [...data.suggestions];
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (error) => {
        this.error = error?.error?.message || 'Could not load friends.';
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  search(): void {
    if (this.query.trim().length < 2) {
      this.results = [];
      this.cdr.markForCheck();
      return;
    }

    this.friendsService.search(this.query).subscribe({
      next: (results) => {
        this.results = [...results];
        this.cdr.markForCheck();
      },
      error: (error) => {
        this.error = error?.error?.message || 'Search failed.';
        this.cdr.markForCheck();
      }
    });
  }

  send(user: PublicUser): void {
    this.clear();

    this.friendsService.send(user.id).subscribe({
      next: () => {
        this.message = 'Friend request sent.';
        this.results = this.results.map((item) =>
          item.id === user.id
            ? { ...item, relationshipStatus: 'OUTGOING' }
            : item
        );
        this.reload();
        this.cdr.markForCheck();
      },
      error: (error) => {
        this.error = error?.error?.message || 'Could not send request.';
        this.cdr.markForCheck();
      }
    });
  }

  accept(request: FriendRequest): void {
    this.clear();

    this.friendsService.accept(request.id).subscribe({
      next: () => {
        this.message = 'You are now friends.';
        this.incoming = this.incoming.filter((item) => item.id !== request.id);
        this.friends = [...this.friends, {
          ...request.user,
          relationshipStatus: 'FRIENDS'
        }];
        this.activeTab = 'friends';
        this.reload();
        this.cdr.markForCheck();
      },
      error: (error) => {
        this.error = error?.error?.message || 'Could not accept request.';
        this.cdr.markForCheck();
      }
    });
  }

  reject(request: FriendRequest): void {
    this.clear();

    this.friendsService.reject(request.id).subscribe({
      next: () => {
        this.incoming = this.incoming.filter((item) => item.id !== request.id);
        this.reload();
        this.cdr.markForCheck();
      },
      error: (error) => {
        this.error = error?.error?.message || 'Could not reject request.';
        this.cdr.markForCheck();
      }
    });
  }

  remove(user: PublicUser): void {
    if (!confirm(`Remove ${user.fullName} from friends?`)) {
      return;
    }

    this.friendsService.remove(user.id).subscribe({
      next: () => {
        this.friends = this.friends.filter((item) => item.id !== user.id);
        this.reload();
        this.cdr.markForCheck();
      },
      error: (error) => {
        this.error = error?.error?.message || 'Could not remove friend.';
        this.cdr.markForCheck();
      }
    });
  }

  avatarText(user: PublicUser): string {
    return user.fullName
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part: string) => part[0].toUpperCase())
      .join('');
  }

  clear(): void {
    this.message = '';
    this.error = '';
  }

  go(path: string): void {
    this.router.navigate([path]);
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/signin']);
  }
}
