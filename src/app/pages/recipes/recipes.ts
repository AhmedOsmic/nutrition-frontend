import {
  ChangeDetectorRef,
  Component,
  Inject,
  PLATFORM_ID
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Auth, AuthUser } from '../../services/auth';
import {
  NutritionAiService,
  RecipeRecommendation
} from '../../services/ai';

@Component({
  selector: 'app-recipes',
  imports: [CommonModule, FormsModule],
  templateUrl: './recipes.html',
  styleUrl: './recipes.css'
})
export class Recipes {
  mealType = 'Dinner';
  maxPreparationMinutes = 30;
  additionalPreferences = '';
  recipes: RecipeRecommendation[] = [];
  loading = false;
  error = '';
  currentUser: AuthUser | null;
  private readonly browser: boolean;

  readonly mealTypes = ['Breakfast', 'Lunch', 'Dinner', 'Snack'];

  constructor(
    private aiService: NutritionAiService,
    private auth: Auth,
    private router: Router,
    private cdr: ChangeDetectorRef,
    @Inject(PLATFORM_ID) platformId: object
  ) {
    this.currentUser = this.auth.getCurrentUser();
    this.browser = isPlatformBrowser(platformId);
  }

  get initials(): string {
    return (this.currentUser?.fullName || 'U')
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part: string) => part[0].toUpperCase())
      .join('');
  }

  generate(): void {
    if (!this.browser || this.loading) {
      return;
    }

    this.loading = true;
    this.error = '';
    this.recipes = [];
    this.cdr.markForCheck();

    this.aiService.recommendRecipes({
      mealType: this.mealType,
      maxPreparationMinutes: Number(this.maxPreparationMinutes),
      additionalPreferences: this.additionalPreferences.trim()
    }).subscribe({
      next: (recipes) => {
        this.recipes = [...recipes];
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (error) => {
        this.error = error?.error?.message ||
          'Recipe recommendations are unavailable right now.';
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  recipeEmoji(recipe: RecipeRecommendation): string {
    const type = recipe.mealType.toLowerCase();
    if (type.includes('breakfast')) return '🥣';
    if (type.includes('lunch')) return '🥗';
    if (type.includes('snack')) return '🍎';
    return '🍽️';
  }

  go(path: string): void {
    this.router.navigate([path]);
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/signin']);
  }
}
