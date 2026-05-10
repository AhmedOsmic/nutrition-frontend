import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export type PublicUser = {
  id: number;
  fullName: string;
  username: string | null;
  bio: string | null;
  avatarUrl: string | null;
  mutualFriends: number;
  relationshipStatus: 'NONE' | 'OUTGOING' | 'INCOMING' | 'FRIENDS' | 'SELF';
};

export type FriendRequest = {
  id: number;
  user: PublicUser;
  status: string;
  createdAt: string;
};

@Injectable({ providedIn: 'root' })
export class FriendsService {
  private readonly apiUrl = 'http://localhost:8080/api/friends';

  constructor(private http: HttpClient) {}

  getFriends(): Observable<PublicUser[]> {
    return this.http.get<PublicUser[]>(this.apiUrl);
  }

  search(query: string): Observable<PublicUser[]> {
    const params = new HttpParams().set('q', query.trim());
    return this.http.get<PublicUser[]>(`${this.apiUrl}/search`, { params });
  }

  suggestions(): Observable<PublicUser[]> {
    return this.http.get<PublicUser[]>(`${this.apiUrl}/suggestions`);
  }

  incoming(): Observable<FriendRequest[]> {
    return this.http.get<FriendRequest[]>(`${this.apiUrl}/requests/incoming`);
  }

  outgoing(): Observable<FriendRequest[]> {
    return this.http.get<FriendRequest[]>(`${this.apiUrl}/requests/outgoing`);
  }

  send(userId: number): Observable<FriendRequest> {
    return this.http.post<FriendRequest>(`${this.apiUrl}/requests/${userId}`, {});
  }

  accept(requestId: number): Observable<{message: string}> {
    return this.http.patch<{message: string}>(`${this.apiUrl}/requests/${requestId}/accept`, {});
  }

  reject(requestId: number): Observable<{message: string}> {
    return this.http.patch<{message: string}>(`${this.apiUrl}/requests/${requestId}/reject`, {});
  }

  remove(friendId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${friendId}`);
  }
}
