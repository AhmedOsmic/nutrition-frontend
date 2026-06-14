import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export type DiaryMeal = {
  id: number;
  mealType: string;
  foodName: string;
  amountGrams: number;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  createdAt: string;
};

export type DiaryDay = {
  date: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  meals: DiaryMeal[];
};

@Injectable({ providedIn: 'root' })
export class DiaryService {
  private readonly apiUrl = 'http://localhost:8080/api/diary';

  constructor(private http: HttpClient) {}

  getDiary(from: string, to: string): Observable<DiaryDay[]> {
    const params = new HttpParams()
      .set('from', from)
      .set('to', to);

    return this.http.get<DiaryDay[]>(this.apiUrl, { params });
  }
}
