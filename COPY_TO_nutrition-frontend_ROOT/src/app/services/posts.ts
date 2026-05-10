import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PublicUser } from './friends';

export type PostMeal = {
  id: number;
  mealType: string;
  foodName: string;
  amountGrams: number;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
};

export type PostComment = {
  id: number;
  author: PublicUser;
  content: string;
  createdAt: string;
};

export type SocialPost = {
  id: number;
  author: PublicUser;
  caption: string;
  imageUrl: string | null;
  meal: PostMeal | null;
  likesCount: number;
  commentsCount: number;
  likedByCurrentUser: boolean;
  createdAt: string;
  comments: PostComment[];
};

@Injectable({ providedIn: 'root' })
export class PostsService {
  private readonly apiUrl = 'http://localhost:8080/api/posts';

  constructor(private http: HttpClient) {}

  feed(): Observable<SocialPost[]> {
    return this.http.get<SocialPost[]>(`${this.apiUrl}/feed`);
  }

  create(caption: string, imageUrl: string | null, mealEntryId: number | null): Observable<SocialPost> {
    return this.http.post<SocialPost>(this.apiUrl, { caption, imageUrl, mealEntryId });
  }

  toggleLike(postId: number): Observable<SocialPost> {
    return this.http.post<SocialPost>(`${this.apiUrl}/${postId}/like`, {});
  }

  addComment(postId: number, content: string): Observable<PostComment> {
    return this.http.post<PostComment>(`${this.apiUrl}/${postId}/comments`, { content });
  }

  comments(postId: number): Observable<PostComment[]> {
    return this.http.get<PostComment[]>(`${this.apiUrl}/${postId}/comments`);
  }

  delete(postId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${postId}`);
  }
}
