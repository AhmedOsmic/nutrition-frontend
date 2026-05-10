import { ChangeDetectorRef, Component, HostListener, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { forkJoin, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import {
  BarcodeProductResponse,
  DetectedFoodItem,
  FoodAnalysisResponse,
  FoodSearchResponse,
  MealPayload,
  MealResponse,
  MealsService
} from '../../services/meal';
import { ProfileService, UserProfileResponse } from '../../services/profile';
import { Auth } from '../../services/auth';
import { AccountProfile, AccountService } from '../../services/account';
import { NutritionChat } from '../../components/nutrition-chat/nutrition-chat';

type GoalType = 'lose' | 'maintain' | 'gain';
type MealType = 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack';

type AuthUser = {
  id: number;
  fullName: string;
  email: string;
  username?: string | null;
  avatarUrl?: string | null;
};

type DailyTargets = {
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
};

type Step1Data = {
  unitSystem: 'metric' | 'imperial';
  age: number;
  gender: string;
  heightCm?: number;
  weightKg?: number;
  heightFt?: number;
  heightIn?: number;
  weightLbs?: number;
};

type Step2Data = {
  activityLevel: string;
  goal: GoalType;
  targetWeight: number;
  targetWeightUnit: 'kg' | 'lbs';
  mealsPerDay: number;
};

type Step3Data = {
  allergies: string[];
  foodsToAvoid: string;
  preferredCuisine: string;
};

type OnboardingSummary = {
  step1: Step1Data;
  step2: Step2Data;
  step3: Step3Data | null;
  dailyTargets: DailyTargets;
};

type DashboardMeal = {
  id: number;
  mealType: MealType;
  name: string;
  amountGrams: number;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  createdAt: string;
};

type NutritionPer100g = {
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
};

type AnalyzedFoodNutrition = {
  item: DetectedFoodItem;
  nutrition: FoodSearchResponse | null;
};

type MealFormGroup = FormGroup<{
  mealType: FormControl<MealType>;
  name: FormControl<string>;
  amount: FormControl<number>;
  calories: FormControl<number>;
  protein: FormControl<number>;
  carbs: FormControl<number>;
  fats: FormControl<number>;
}>;

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, ReactiveFormsModule, NutritionChat],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class Dashboard {
  private readonly ouncesToGramsFactor = 28.349523125;
  private isBrowser: boolean;
  private nutritionPer100g: NutritionPer100g | null = null;

  currentUser: AuthUser = {
    id: 0,
    fullName: 'User',
    email: '',
    username: null,
    avatarUrl: null
  };

  profileMenuOpen = false;

  summary: OnboardingSummary | null = null;

  dailyTargets: DailyTargets = {
    calories: 2000,
    protein: 120,
    carbs: 200,
    fats: 60
  };

  consumed: DailyTargets = {
    calories: 0,
    protein: 0,
    carbs: 0,
    fats: 0
  };

  meals: DashboardMeal[] = [];
  showMealForm = false;
  editingMealId: number | null = null;

  isSearchingFood = false;
  foodSearchMessage = '';
  foodSearchError = '';

  isScanningFood = false;
  scanFoodMessage = '';
  scanFoodError = '';

  isScanningBarcode = false;
  barcodeMessage = '';
  barcodeError = '';

  mealTypes: MealType[] = ['Breakfast', 'Lunch', 'Dinner', 'Snack'];
  mealForm: MealFormGroup;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private mealsService: MealsService,
    private profileService: ProfileService,
    private accountService: AccountService,
    private auth: Auth,
    private cdr: ChangeDetectorRef,
    @Inject(PLATFORM_ID) platformId: object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);

    this.mealForm = this.fb.nonNullable.group({
      mealType: ['Breakfast' as MealType, [Validators.required]],
      name: ['', [Validators.required, Validators.minLength(2)]],
      amount: [100, [Validators.required, Validators.min(0.1)]],
      calories: [0, [Validators.required, Validators.min(0)]],
      protein: [0, [Validators.required, Validators.min(0)]],
      carbs: [0, [Validators.required, Validators.min(0)]],
      fats: [0, [Validators.required, Validators.min(0)]]
    });

    if (this.isBrowser) {
      this.loadCurrentUser();

      if (!this.currentUser.id) {
        this.router.navigate(['/signin']);
        return;
      }

      this.loadHeaderAccount();
      this.loadProfileFromBackend();
      this.loadMealsFromBackend();
    }
  }

  get firstName(): string {
    const fullName = (this.currentUser.fullName || 'User').trim();
    return fullName.split(' ')[0] || 'User';
  }

  get initials(): string {
    const parts = (this.currentUser.fullName || 'User')
      .trim()
      .split(' ')
      .filter(Boolean)
      .slice(0, 2);

    const result = parts
      .map((part: string) => part[0].toUpperCase())
      .join('');

    return result || 'U';
  }

  get usesImperial(): boolean {
    return this.summary?.step1?.unitSystem === 'imperial';
  }

  get amountUnitLabel(): 'g' | 'oz' {
    return this.usesImperial ? 'oz' : 'g';
  }

  get currentWeightLabel(): string {
    if (!this.summary?.step1) {
      return '-';
    }

    const step1 = this.summary.step1;

    if (step1.unitSystem === 'imperial') {
      return `${step1.weightLbs} lbs`;
    }

    return `${step1.weightKg} kg`;
  }

  get goalWeightLabel(): string {
    if (!this.summary?.step2) {
      return '-';
    }

    return `${this.summary.step2.targetWeight} ${this.summary.step2.targetWeightUnit}`;
  }

  get goalLabel(): string {
    const goal = this.summary?.step2?.goal;

    if (goal === 'lose') {
      return 'Lose Weight';
    }

    if (goal === 'gain') {
      return 'Gain Muscle';
    }

    return 'Maintain Weight';
  }

  get caloriesRemaining(): number {
    return Math.max(
      this.roundNutritionValue(this.dailyTargets.calories - this.consumed.calories),
      0
    );
  }

  get caloriesUsedPercent(): number {
    return this.getPercent(this.consumed.calories, this.dailyTargets.calories);
  }

  get proteinPercent(): number {
    return this.getPercent(this.consumed.protein, this.dailyTargets.protein);
  }

  get carbsPercent(): number {
    return this.getPercent(this.consumed.carbs, this.dailyTargets.carbs);
  }

  get fatsPercent(): number {
    return this.getPercent(this.consumed.fats, this.dailyTargets.fats);
  }

  private loadCurrentUser(): void {
    const raw = localStorage.getItem('authUser');

    if (!raw) {
      return;
    }

    try {
      const parsed = JSON.parse(raw) as Partial<AuthUser>;

      this.currentUser = {
        id: Number(parsed.id || 0),
        fullName: parsed.fullName || 'User',
        email: parsed.email || '',
        username: parsed.username || null,
        avatarUrl: parsed.avatarUrl || null
      };
    } catch {
      this.currentUser = {
        id: 0,
        fullName: 'User',
        email: '',
        username: null,
        avatarUrl: null
      };
    }
  }


  private loadHeaderAccount(): void {
    this.accountService.getProfile().subscribe({
      next: (profile: AccountProfile) => {
        this.currentUser = {
          id: profile.id,
          fullName: profile.fullName,
          email: profile.email,
          username: profile.username,
          avatarUrl: profile.avatarUrl
        };

        localStorage.setItem('authUser', JSON.stringify(this.currentUser));
        this.cdr.markForCheck();
      },
      error: (error: HttpErrorResponse) => {
        console.log('ACCOUNT HEADER LOAD ERROR:', error);
        this.cdr.markForCheck();
      }
    });
  }

  private loadProfileFromBackend(): void {
    this.profileService.getProfile().subscribe({
      next: (profile: UserProfileResponse) => {
        this.summary = this.mapProfileToSummary(profile);
        this.dailyTargets = this.summary.dailyTargets;

        if (
          this.editingMealId === null &&
          !this.mealForm.controls.name.value.trim()
        ) {
          this.mealForm.controls.amount.setValue(this.getDefaultDisplayAmount());
        }

        localStorage.setItem('hasCompletedOnboarding', 'true');
        localStorage.setItem('onboardingSummary', JSON.stringify(this.summary));
        this.cdr.markForCheck();
      },
      error: (error: HttpErrorResponse) => {
        console.log('PROFILE LOAD ERROR:', error);
        this.cdr.markForCheck();
        this.router.navigate(['/onboarding']);
      }
    });
  }

  private mapProfileToSummary(profile: UserProfileResponse): OnboardingSummary {
    const isImperial = profile.unitSystem === 'imperial';
    const weightLbs = Number((profile.weightKg / 0.45359237).toFixed(1));
    const targetWeightLbs = Number((profile.targetWeightKg / 0.45359237).toFixed(1));
    const totalInches = profile.heightCm / 2.54;
    const heightFt = Math.floor(totalInches / 12);
    const heightIn = Math.round(totalInches - (heightFt * 12));

    return {
      step1: {
        unitSystem: isImperial ? 'imperial' : 'metric',
        age: profile.age,
        gender: profile.gender,
        heightCm: profile.heightCm,
        weightKg: profile.weightKg,
        heightFt: isImperial ? heightFt : undefined,
        heightIn: isImperial ? heightIn : undefined,
        weightLbs: isImperial ? weightLbs : undefined
      },
      step2: {
        activityLevel: profile.activityLevel,
        goal: this.normalizeGoal(profile.goal),
        targetWeight: isImperial ? targetWeightLbs : profile.targetWeightKg,
        targetWeightUnit: isImperial ? 'lbs' : 'kg',
        mealsPerDay: profile.mealsPerDay
      },
      step3: {
        allergies: profile.allergies
          ? profile.allergies
              .split(',')
              .map((item: string) => item.trim())
              .filter(Boolean)
          : [],
        foodsToAvoid: profile.foodsToAvoid || '',
        preferredCuisine: profile.preferredCuisine || ''
      },
      dailyTargets: {
        calories: profile.targetCalories,
        protein: profile.targetProtein,
        carbs: profile.targetCarbs,
        fats: profile.targetFats
      }
    };
  }

  private normalizeGoal(goal: string): GoalType {
    if (goal === 'lose' || goal === 'gain' || goal === 'maintain') {
      return goal;
    }

    return 'maintain';
  }

  private loadMealsFromBackend(): void {
    this.mealsService.getMeals().subscribe({
      next: (meals: MealResponse[]) => {
        this.meals = meals.map((meal: MealResponse) => this.mapMeal(meal));
        this.sortMeals();
        this.updateConsumed();
        this.cdr.markForCheck();
      },
      error: (error: HttpErrorResponse) => {
        console.log('MEALS LOAD ERROR:', error);
        this.meals = [];
        this.updateConsumed();
        this.cdr.markForCheck();
      }
    });
  }

  private mapMeal(meal: MealResponse): DashboardMeal {
    return {
      id: meal.id,
      mealType: this.normalizeMealType(meal.mealType),
      name: meal.foodName,
      amountGrams: Number(meal.amountGrams ?? 100),
      calories: Number(meal.calories),
      protein: Number(meal.protein),
      carbs: Number(meal.carbs),
      fats: Number(meal.fats),
      createdAt: meal.createdAt
    };
  }

  private normalizeMealType(mealType: string): MealType {
    if (
      mealType === 'Breakfast' ||
      mealType === 'Lunch' ||
      mealType === 'Dinner' ||
      mealType === 'Snack'
    ) {
      return mealType;
    }

    return 'Snack';
  }

  private updateConsumed(): void {
    this.consumed = {
      calories: this.roundNutritionValue(
        this.meals.reduce((sum: number, meal: DashboardMeal) => sum + meal.calories, 0)
      ),
      protein: this.roundNutritionValue(
        this.meals.reduce((sum: number, meal: DashboardMeal) => sum + meal.protein, 0)
      ),
      carbs: this.roundNutritionValue(
        this.meals.reduce((sum: number, meal: DashboardMeal) => sum + meal.carbs, 0)
      ),
      fats: this.roundNutritionValue(
        this.meals.reduce((sum: number, meal: DashboardMeal) => sum + meal.fats, 0)
      )
    };
  }

  private getPercent(current: number, target: number): number {
    if (!target || target <= 0) {
      return 0;
    }

    return Math.min(100, Math.round((current / target) * 100));
  }

  getMealsByType(mealType: MealType): DashboardMeal[] {
    return this.meals.filter((meal: DashboardMeal) => meal.mealType === mealType);
  }

  hasAnyMeals(): boolean {
    return this.meals.length > 0;
  }

  toggleMealForm(): void {
    this.showMealForm = !this.showMealForm;

    if (!this.showMealForm) {
      this.cancelMealForm();
      return;
    }

    if (this.editingMealId === null) {
      this.mealForm.controls.amount.setValue(this.getDefaultDisplayAmount());
    }
  }

  startEdit(meal: DashboardMeal): void {
    this.clearFoodSearchStatus();
    this.clearScanFoodStatus();
    this.clearBarcodeStatus();
    this.editingMealId = meal.id;
    this.showMealForm = true;

    const factor = meal.amountGrams > 0 ? meal.amountGrams / 100 : 1;

    this.nutritionPer100g = {
      calories: this.roundNutritionValue(meal.calories / factor),
      protein: this.roundNutritionValue(meal.protein / factor),
      carbs: this.roundNutritionValue(meal.carbs / factor),
      fats: this.roundNutritionValue(meal.fats / factor)
    };

    this.mealForm.setValue({
      mealType: meal.mealType,
      name: meal.name,
      amount: this.getDisplayAmount(meal.amountGrams),
      calories: meal.calories,
      protein: meal.protein,
      carbs: meal.carbs,
      fats: meal.fats
    });
  }

  deleteMeal(mealId: number): void {
    this.mealsService.deleteMeal(mealId).subscribe({
      next: () => {
        this.meals = this.meals.filter((meal: DashboardMeal) => meal.id !== mealId);
        this.updateConsumed();
        this.cdr.markForCheck();
      },
      error: (error: HttpErrorResponse) => {
        console.log('DELETE MEAL ERROR:', error);
        this.cdr.markForCheck();
      }
    });
  }

  openFoodScanner(fileInput: HTMLInputElement): void {
    if (this.isScanningFood) {
      return;
    }

    fileInput.click();
  }

  onFoodImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const image = input.files?.[0] ?? null;

    // Omogućava ponovno biranje iste slike.
    input.value = '';

    if (!image) {
      return;
    }

    this.clearScanFoodStatus();
    this.clearFoodSearchStatus();
    this.clearBarcodeStatus();

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];

    if (!allowedTypes.includes(image.type)) {
      this.scanFoodError = 'Choose a JPG, PNG or WEBP image.';
      return;
    }

    if (image.size > 10 * 1024 * 1024) {
      this.scanFoodError = 'The image must be smaller than 10 MB.';
      return;
    }

    this.isScanningFood = true;

    this.mealsService.analyzeFoodImage(image).pipe(
      switchMap((analysis: FoodAnalysisResponse) => {
        const detectedFoods = (analysis.foods ?? []).filter(
          (item: DetectedFoodItem) =>
            Boolean(item.name?.trim()) &&
            Number.isFinite(Number(item.estimatedGrams)) &&
            Number(item.estimatedGrams) > 0
        );

        if (detectedFoods.length === 0) {
          throw new Error('NO_FOOD_DETECTED');
        }

        const nutritionRequests = detectedFoods.map(
          (item: DetectedFoodItem) =>
            this.mealsService.searchFood(item.name).pipe(
              map(
                (nutrition: FoodSearchResponse): AnalyzedFoodNutrition => ({
                  item,
                  nutrition
                })
              ),
              catchError((error: HttpErrorResponse) => {
                console.log(
                  `NUTRITION SEARCH FAILED FOR ${item.name}:`,
                  error
                );

                return of<AnalyzedFoodNutrition>({
                  item,
                  nutrition: null
                });
              })
            )
        );

        return forkJoin(nutritionRequests).pipe(
          map((results: AnalyzedFoodNutrition[]) => ({
            analysis,
            results
          }))
        );
      })
    ).subscribe({
      next: ({
        analysis,
        results
      }: {
        analysis: FoodAnalysisResponse;
        results: AnalyzedFoodNutrition[];
      }) => {
        this.applyFoodScanResult(analysis, results);
        this.isScanningFood = false;
        this.cdr.markForCheck();
      },
      error: (error: unknown) => {
        console.log('FOOD SCAN ERROR:', error);

        this.scanFoodError =
          error instanceof Error && error.message === 'NO_FOOD_DETECTED'
            ? 'No food was detected in the image. Try a clearer photo.'
            : 'Food analysis failed. Check the backend console and try again.';

        this.isScanningFood = false;
        this.cdr.markForCheck();
      }
    });
  }

  private applyFoodScanResult(
    analysis: FoodAnalysisResponse,
    results: AnalyzedFoodNutrition[]
  ): void {
    const successfulResults = results.filter(
      (
        result: AnalyzedFoodNutrition
      ): result is {
        item: DetectedFoodItem;
        nutrition: FoodSearchResponse;
      } => result.nutrition !== null
    );

    if (successfulResults.length === 0) {
      this.scanFoodError =
        'Food was recognized, but nutrition values could not be found.';
      return;
    }

    let totalGrams = 0;
    let totalCalories = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFats = 0;

    for (const result of successfulResults) {
      const grams = Number(result.item.estimatedGrams);
      const factor = grams / 100;

      totalGrams += grams;
      totalCalories += Number(result.nutrition.caloriesPer100g ?? 0) * factor;
      totalProtein += Number(result.nutrition.proteinPer100g ?? 0) * factor;
      totalCarbs +=
        Number(result.nutrition.carbohydratesPer100g ?? 0) * factor;
      totalFats += Number(result.nutrition.fatPer100g ?? 0) * factor;
    }

    totalGrams = this.roundAmount(totalGrams, 1);

    if (totalGrams <= 0) {
      this.scanFoodError =
        'The detected portion size was invalid. Try another image.';
      return;
    }

    this.nutritionPer100g = {
      calories: this.roundNutritionValue((totalCalories / totalGrams) * 100),
      protein: this.roundNutritionValue((totalProtein / totalGrams) * 100),
      carbs: this.roundNutritionValue((totalCarbs / totalGrams) * 100),
      fats: this.roundNutritionValue((totalFats / totalGrams) * 100)
    };

    const fallbackName = successfulResults
      .map((result) => result.item.name)
      .join(', ');

    this.editingMealId = null;
    this.showMealForm = true;

    this.mealForm.patchValue({
      name: analysis.mealName?.trim() || fallbackName,
      amount: this.getDisplayAmount(totalGrams),
      calories: this.roundNutritionValue(totalCalories),
      protein: this.roundNutritionValue(totalProtein),
      carbs: this.roundNutritionValue(totalCarbs),
      fats: this.roundNutritionValue(totalFats)
    });

    const detectedText = successfulResults
      .map(
        (result) =>
          `${result.item.name} (${this.roundAmount(
            Number(result.item.estimatedGrams),
            1
          )} g)`
      )
      .join(', ');

    this.scanFoodMessage =
      `Detected: ${detectedText}. Review the values and click Save Meal.`;

    const failedNames = results
      .filter((result) => result.nutrition === null)
      .map((result) => result.item.name);

    if (failedNames.length > 0) {
      this.scanFoodError =
        `Nutrition was not found for: ${failedNames.join(', ')}.`;
    }
  }


  openBarcodeScanner(fileInput: HTMLInputElement): void {
    if (this.isScanningBarcode) {
      return;
    }

    fileInput.click();
  }

  async onBarcodeImageSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const image = input.files?.[0] ?? null;

    // Omogućava ponovno biranje iste slike.
    input.value = '';

    if (!image) {
      return;
    }

    this.clearBarcodeStatus();
    this.clearFoodSearchStatus();
    this.clearScanFoodStatus();

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];

    if (!allowedTypes.includes(image.type)) {
      this.barcodeError = 'Choose a JPG, PNG or WEBP image of the barcode.';
      return;
    }

    if (image.size > 10 * 1024 * 1024) {
      this.barcodeError = 'The barcode image must be smaller than 10 MB.';
      return;
    }

    this.isScanningBarcode = true;
    let imageUrl = '';

    try {
      const { BrowserMultiFormatReader } = await import('@zxing/browser');
      const codeReader = new BrowserMultiFormatReader();

      imageUrl = URL.createObjectURL(image);

      const result = await codeReader.decodeFromImageUrl(imageUrl);
      const barcode = result.getText().replace(/\D/g, '');

      if (![8, 12, 13, 14].includes(barcode.length)) {
        throw new Error('INVALID_BARCODE');
      }

      this.lookupBarcodeProduct(barcode);
    } catch (error: unknown) {
      console.log('BARCODE DECODE ERROR:', error);

      this.barcodeError =
        error instanceof Error && error.message === 'INVALID_BARCODE'
          ? 'The scanned code is not a supported EAN or UPC product barcode.'
          : 'Barcode could not be read. Use a clear, close photo with the full barcode visible.';

      this.isScanningBarcode = false;
      this.cdr.markForCheck();
    } finally {
      if (imageUrl) {
        URL.revokeObjectURL(imageUrl);
      }
    }
  }

  private lookupBarcodeProduct(barcode: string): void {
    this.mealsService.getProductByBarcode(barcode).subscribe({
      next: (product: BarcodeProductResponse) => {
        this.applyBarcodeProduct(product);
        this.isScanningBarcode = false;
        this.cdr.markForCheck();
      },
      error: (error: HttpErrorResponse) => {
        console.log('BARCODE LOOKUP ERROR:', error);

        if (error.status === 404) {
          this.barcodeError =
            `Product ${barcode} was not found. Manual label entry will be added next.`;
        } else if (error.status === 502) {
          this.barcodeError =
            'Open Food Facts is temporarily unavailable. Try again later.';
        } else {
          this.barcodeError =
            'The barcode was read, but product lookup failed. Check the backend console.';
        }

        this.isScanningBarcode = false;
        this.cdr.markForCheck();
      }
    });
  }

  private applyBarcodeProduct(product: BarcodeProductResponse): void {
    const calories = this.roundNutritionValue(product.caloriesPer100g);
    const protein = this.roundNutritionValue(product.proteinPer100g);
    const carbs = this.roundNutritionValue(product.carbohydratesPer100g);
    const fats = this.roundNutritionValue(product.fatPer100g);

    this.nutritionPer100g = {
      calories,
      protein,
      carbs,
      fats
    };

    this.editingMealId = null;
    this.showMealForm = true;

    const defaultAmount = this.getDefaultDisplayAmount();

    this.mealForm.patchValue({
      name: product.productName,
      amount: defaultAmount
    });

    this.recalculateNutritionFromAmount();

    const brandText = product.brand?.trim()
      ? ` (${product.brand.trim()})`
      : '';

    this.barcodeMessage =
      `Barcode ${product.barcode}: ${product.productName}${brandText}. ` +
      'Review the amount and nutrition values, then click Save Meal.';

    if (!product.nutritionComplete) {
      this.barcodeError =
        'The product was found, but some nutrition values are missing. Check the package label and correct the fields before saving.';
    }
  }

  clearBarcodeStatus(): void {
    this.barcodeMessage = '';
    this.barcodeError = '';
  }

  clearScanFoodStatus(): void {
    this.scanFoodMessage = '';
    this.scanFoodError = '';
  }

  searchFood(): void {
    const foodName = this.mealForm.controls.name.value.trim();

    this.clearFoodSearchStatus();
    this.clearScanFoodStatus();
    this.clearBarcodeStatus();

    if (foodName.length < 2) {
      this.foodSearchError = 'Enter at least 2 characters before searching.';
      this.mealForm.controls.name.markAsTouched();
      return;
    }

    this.isSearchingFood = true;

    this.mealsService.searchFood(foodName).subscribe({
      next: (food: FoodSearchResponse) => {
        this.nutritionPer100g = {
          calories: this.roundNutritionValue(food.caloriesPer100g),
          protein: this.roundNutritionValue(food.proteinPer100g),
          carbs: this.roundNutritionValue(food.carbohydratesPer100g),
          fats: this.roundNutritionValue(food.fatPer100g)
        };

        this.mealForm.controls.name.setValue(food.matchedFoodName || foodName);
        this.recalculateNutritionFromAmount();
        this.updateFoodSearchMessage(food.matchedFoodName || foodName);
        this.isSearchingFood = false;
        this.cdr.markForCheck();
      },
      error: (error: HttpErrorResponse) => {
        console.log('FOOD SEARCH ERROR:', error);
        this.foodSearchError = 'Food was not found. Try a more specific English name.';
        this.isSearchingFood = false;
        this.cdr.markForCheck();
      }
    });
  }

  onAmountChanged(): void {
    if (!this.nutritionPer100g) {
      return;
    }

    this.recalculateNutritionFromAmount();
    this.updateFoodSearchMessage(this.mealForm.controls.name.value.trim());
  }

  clearFoodSearchStatus(): void {
    this.foodSearchMessage = '';
    this.foodSearchError = '';
  }

  private recalculateNutritionFromAmount(): void {
    if (!this.nutritionPer100g) {
      return;
    }

    const amountGrams = this.getAmountInGramsFromForm();
    const factor = amountGrams / 100;

    this.mealForm.patchValue(
      {
        calories: this.roundNutritionValue(this.nutritionPer100g.calories * factor),
        protein: this.roundNutritionValue(this.nutritionPer100g.protein * factor),
        carbs: this.roundNutritionValue(this.nutritionPer100g.carbs * factor),
        fats: this.roundNutritionValue(this.nutritionPer100g.fats * factor)
      },
      { emitEvent: false }
    );
  }

  private updateFoodSearchMessage(foodName: string): void {
    const amount = this.mealForm.controls.amount.value;
    this.foodSearchMessage = `Nutrition values calculated for ${amount} ${this.amountUnitLabel} of ${foodName}.`;
  }

  private roundNutritionValue(value: number | null | undefined): number {
    const numericValue = Number(value ?? 0);

    if (!Number.isFinite(numericValue)) {
      return 0;
    }

    return Number(numericValue.toFixed(1));
  }

  private roundAmount(value: number, decimals: number): number {
    if (!Number.isFinite(value)) {
      return 0;
    }

    return Number(value.toFixed(decimals));
  }

  private getDefaultDisplayAmount(): number {
    return this.usesImperial ? 3.5 : 100;
  }

  private getAmountInGramsFromForm(): number {
    const amount = Number(this.mealForm.controls.amount.value);

    if (!Number.isFinite(amount) || amount <= 0) {
      return 0;
    }

    const grams = this.usesImperial
      ? amount * this.ouncesToGramsFactor
      : amount;

    return this.roundAmount(grams, 1);
  }

  private getDisplayAmount(amountGrams: number): number {
    if (this.usesImperial) {
      return this.roundAmount(amountGrams / this.ouncesToGramsFactor, 2);
    }

    return this.roundAmount(amountGrams, 1);
  }

  getMealAmountLabel(meal: DashboardMeal): string {
    const amount = this.getDisplayAmount(meal.amountGrams);
    return `${amount} ${this.amountUnitLabel}`;
  }

  saveMeal(): void {
    if (this.mealForm.invalid) {
      this.mealForm.markAllAsTouched();
      return;
    }

    const value = this.mealForm.getRawValue();

    const payload: MealPayload = {
      mealType: value.mealType,
      foodName: value.name.trim(),
      amountGrams: this.getAmountInGramsFromForm(),
      calories: Number(value.calories),
      protein: Number(value.protein),
      carbs: Number(value.carbs),
      fats: Number(value.fats)
    };

    if (this.editingMealId !== null) {
      const mealId = this.editingMealId;

      this.mealsService
        .updateMeal(mealId, payload)
        .subscribe({
          next: (updatedMeal: MealResponse) => {
            const mappedMeal = this.mapMeal(updatedMeal);

            this.meals = this.meals.map((meal: DashboardMeal) =>
              meal.id === mealId ? mappedMeal : meal
            );

            this.sortMeals();
            this.updateConsumed();
            this.cancelMealForm();
            this.cdr.markForCheck();
          },
          error: (error: HttpErrorResponse) => {
            console.log('UPDATE MEAL ERROR:', error);
            this.cdr.markForCheck();
          }
        });

      return;
    }

    this.mealsService.createMeal(payload).subscribe({
      next: (createdMeal: MealResponse) => {
        this.meals = [...this.meals, this.mapMeal(createdMeal)];
        this.sortMeals();
        this.updateConsumed();
        this.cancelMealForm();
        this.cdr.markForCheck();
      },
      error: (error: HttpErrorResponse) => {
        console.log('CREATE MEAL ERROR:', error);
        this.cdr.markForCheck();
      }
    });
  }

  cancelMealForm(): void {
    this.clearFoodSearchStatus();
    this.clearScanFoodStatus();
    this.clearBarcodeStatus();
    this.isSearchingFood = false;
    this.isScanningFood = false;
    this.isScanningBarcode = false;
    this.editingMealId = null;
    this.showMealForm = false;
    this.nutritionPer100g = null;

    this.mealForm.reset({
      mealType: 'Breakfast' as MealType,
      name: '',
      amount: this.getDefaultDisplayAmount(),
      calories: 0,
      protein: 0,
      carbs: 0,
      fats: 0
    });
  }

  private sortMeals(): void {
    const orderMap: Record<MealType, number> = {
      Breakfast: 0,
      Lunch: 1,
      Dinner: 2,
      Snack: 3
    };

    this.meals = [...this.meals].sort((a: DashboardMeal, b: DashboardMeal) => {
      if (orderMap[a.mealType] !== orderMap[b.mealType]) {
        return orderMap[a.mealType] - orderMap[b.mealType];
      }

      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });
  }

  getMealEmoji(mealType: MealType): string {
    if (mealType === 'Breakfast') {
      return '🍳';
    }

    if (mealType === 'Lunch') {
      return '🥗';
    }

    if (mealType === 'Dinner') {
      return '🍽️';
    }

    return '🍎';
  }

  getHealthTipTitle(): string {
    const goal = this.summary?.step2?.goal;

    if (goal === 'lose') {
      return 'Focus on protein and whole foods';
    }

    if (goal === 'gain') {
      return 'Aim for consistent meals';
    }

    return 'Stay consistent with your targets';
  }

  getHealthTipText(): string {
    const step3 = this.summary?.step3;

    if (step3?.allergies?.length) {
      return `Remember to avoid: ${step3.allergies.join(', ')}. Always check ingredient labels before adding meals.`;
    }

    if (step3?.foodsToAvoid?.trim()) {
      return `You chose to avoid ${step3.foodsToAvoid}. Try building meals that match your preference every day.`;
    }

    return 'Start simple: add your meals regularly and compare them against your calories and macro targets.';
  }


  toggleProfileMenu(): void {
    this.profileMenuOpen = !this.profileMenuOpen;
  }

  openProfileMenuPage(path: string): void {
    this.profileMenuOpen = false;
    this.router.navigate([path]);
  }

  @HostListener('document:click')
  closeProfileMenu(): void {
    this.profileMenuOpen = false;
  }

  goTo(path: string): void {
    this.router.navigate([path]);
  }

  goToPlaceholder(action: string): void {
    if (this.isBrowser) {
      alert(`${action} will be connected next.`);
    }
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/signin']);
  }
}
