import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export type UserProfilePayload = {
  unitSystem: string;
  age: number;
  gender: string;
  heightCm: number;
  weightKg: number;
  activityLevel: string;
  goal: string;
  targetWeightKg: number;
  mealsPerDay: number;
  allergies: string;
  foodsToAvoid: string;
  preferredCuisine: string;
  targetCalories: number;
  targetProtein: number;
  targetCarbs: number;
  targetFats: number;
};

export type UserProfileResponse = {
  id: number;
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
  onboardingCompleted: boolean;
};

@Injectable({
  providedIn: 'root'
})
export class ProfileService {
  private readonly apiUrl = 'http://localhost:8080/api/profile';

  constructor(private http: HttpClient) {}

  saveProfile(data: UserProfilePayload): Observable<UserProfileResponse> {
    return this.http.post<UserProfileResponse>(this.apiUrl, data);
  }

  getProfile(): Observable<UserProfileResponse> {
    return this.http.get<UserProfileResponse>(this.apiUrl);
  }
}
