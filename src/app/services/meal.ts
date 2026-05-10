import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../config/api-config';

export type MealPayload = {
  mealType: string;
  foodName: string;
  amountGrams: number;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
};

export type MealResponse = {
  id: number;
  mealType: string;
  foodName: string;
  amountGrams?: number;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  entryDate?: string;
  createdAt: string;
  updatedAt?: string;
};

export type FoodSearchResponse = {
  fdcId: number;
  searchedFoodName: string;
  matchedFoodName: string;
  dataType: string;
  matchScore: number;
  caloriesPer100g: number;
  proteinPer100g: number;
  carbohydratesPer100g: number;
  fatPer100g: number;
  fiberPer100g: number | null;
  sugarPer100g: number | null;
  sodiumMgPer100g: number | null;
};

export type DetectedFoodItem = {
  name: string;
  estimatedGrams: number;
  confidence: number;
};

export type FoodAnalysisResponse = {
  mealName: string;
  foods: DetectedFoodItem[];
};

export type BarcodeProductResponse = {
  barcode: string;
  productName: string;
  brand: string | null;
  caloriesPer100g: number | null;
  proteinPer100g: number | null;
  carbohydratesPer100g: number | null;
  fatPer100g: number | null;
  imageUrl: string | null;
  source: string;
  nutritionComplete: boolean;
};

@Injectable({
  providedIn: 'root'
})
export class MealsService {
  private readonly mealsApiUrl = `${API_BASE_URL}/api/meals`;
  private readonly nutritionApiUrl = `${API_BASE_URL}/api/nutrition`;
  private readonly foodAnalysisApiUrl = `${API_BASE_URL}/api/food-analysis`;
  private readonly barcodeApiUrl = `${API_BASE_URL}/api/barcodes`;

  constructor(private http: HttpClient) {}

  getMeals(date?: string): Observable<MealResponse[]> {
    if (date) {
      const params = new HttpParams().set('date', date);
      return this.http.get<MealResponse[]>(this.mealsApiUrl, { params });
    }

    return this.http.get<MealResponse[]>(this.mealsApiUrl);
  }

  createMeal(payload: MealPayload): Observable<MealResponse> {
    return this.http.post<MealResponse>(this.mealsApiUrl, payload);
  }

  updateMeal(
    mealId: number,
    payload: MealPayload
  ): Observable<MealResponse> {
    return this.http.put<MealResponse>(
      `${this.mealsApiUrl}/${mealId}`,
      payload
    );
  }

  deleteMeal(mealId: number): Observable<void> {
    return this.http.delete<void>(`${this.mealsApiUrl}/${mealId}`);
  }

  searchFood(foodName: string): Observable<FoodSearchResponse> {
    const params = new HttpParams().set('food', foodName.trim());

    return this.http.get<FoodSearchResponse>(
      `${this.nutritionApiUrl}/search`,
      { params }
    );
  }

  analyzeFoodImage(image: File): Observable<FoodAnalysisResponse> {
    const formData = new FormData();
    formData.append('image', image);

    return this.http.post<FoodAnalysisResponse>(
      `${this.foodAnalysisApiUrl}/analyze`,
      formData
    );
  }

  getProductByBarcode(barcode: string): Observable<BarcodeProductResponse> {
    const normalizedBarcode = barcode.replace(/\D/g, '');

    return this.http.get<BarcodeProductResponse>(
      `${this.barcodeApiUrl}/${normalizedBarcode}`
    );
  }
}
