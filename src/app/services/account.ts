import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../config/api-config';

export type AccountProfile = {
  id: number;
  fullName: string;
  email: string;
  username: string | null;
  bio: string | null;
  avatarUrl: string | null;
  unitSystem: string;
  age: number;
  gender: string;
  heightCm: number;
  weightKg: number;
  activityLevel: string;
  goal: string;
  targetWeightKg: number;
  mealsPerDay: number;
  allergies: string | null;
  foodsToAvoid: string | null;
  preferredCuisine: string | null;
  targetCalories: number;
  targetProtein: number;
  targetCarbs: number;
  targetFats: number;
};

export type AccountProfileUpdate = Omit<AccountProfile, 'id' | 'email'>;

@Injectable({ providedIn: 'root' })
export class AccountService {
  private readonly apiUrl = `${API_BASE_URL}/api/account`;

  constructor(private http: HttpClient) {}

  getProfile(): Observable<AccountProfile> {
    return this.http.get<AccountProfile>(`${this.apiUrl}/me`);
  }

  updateProfile(payload: AccountProfileUpdate): Observable<AccountProfile> {
    return this.http.put<AccountProfile>(`${this.apiUrl}/me`, payload);
  }

  changePassword(currentPassword: string, newPassword: string): Observable<{message: string}> {
    return this.http.put<{message: string}>(`${this.apiUrl}/password`, {
      currentPassword,
      newPassword
    });
  }
}
