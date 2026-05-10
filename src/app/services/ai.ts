import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../config/api-config';

export type NutritionChatResponse = {
  answer: string;
  disclaimer: string;
};

export type RecipeRecommendationRequest = {
  mealType: string;
  maxPreparationMinutes: number;
  additionalPreferences: string;
};

export type RecipeRecommendation = {
  title: string;
  description: string;
  mealType: string;
  preparationMinutes: number;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  ingredients: string[];
  steps: string[];
  reason: string;
};

@Injectable({ providedIn: 'root' })
export class NutritionAiService {
  private readonly apiUrl = `${API_BASE_URL}/api/ai`;

  constructor(private http: HttpClient) {}

  ask(message: string): Observable<NutritionChatResponse> {
    return this.http.post<NutritionChatResponse>(`${this.apiUrl}/chat`, {
      message
    });
  }

  recommendRecipes(
    request: RecipeRecommendationRequest
  ): Observable<RecipeRecommendation[]> {
    return this.http.post<RecipeRecommendation[]>(
      `${this.apiUrl}/recipes`,
      request
    );
  }
}
