import {Component,Inject,PLATFORM_ID} from '@angular/core';
import {CommonModule,isPlatformBrowser} from '@angular/common';
import {FormBuilder,ReactiveFormsModule,Validators} from '@angular/forms';
import {Router} from '@angular/router';

type GoalType='lose'|'maintain'|'gain';
type MealType='Breakfast'|'Lunch'|'Dinner'|'Snack';

type AuthUser={
  fullName:string;
  email:string;
};

type DailyTargets={
  calories:number;
  protein:number;
  carbs:number;
  fats:number;
};

type Step1Data={
  unitSystem:'metric'|'imperial';
  age:number;
  gender:string;
  heightCm?:number;
  weightKg?:number;
  heightFt?:number;
  heightIn?:number;
  weightLbs?:number;
};

type Step2Data={
  activityLevel:string;
  goal:GoalType;
  targetWeight:number;
  targetWeightUnit:'kg'|'lbs';
  mealsPerDay:number;
};

type Step3Data={
  allergies:string[];
  foodsToAvoid:string;
  preferredCuisine:string;
};

type OnboardingSummary={
  step1:Step1Data;
  step2:Step2Data;
  step3:Step3Data|null;
  dailyTargets:DailyTargets;
};

type DashboardMeal={
  id:string;
  mealType:MealType;
  name:string;
  calories:number;
  protein:number;
  carbs:number;
  fats:number;
  createdAt:string;
};

@Component({
  selector:'app-dashboard',
  imports:[CommonModule,ReactiveFormsModule],
  templateUrl:'./dashboard.html',
  styleUrl:'./dashboard.css'
})
export class Dashboard{
  private isBrowser:boolean;

  currentUser:AuthUser={
    fullName:'User',
    email:''
  };

  summary:OnboardingSummary|null=null;

  dailyTargets:DailyTargets={
    calories:2000,
    protein:120,
    carbs:200,
    fats:60
  };

  consumed={
    calories:0,
    protein:0,
    carbs:0,
    fats:0
  };

  meals:DashboardMeal[]=[];
  showMealForm=false;
  editingMealId:string|null=null;

  mealTypes:MealType[]=['Breakfast','Lunch','Dinner','Snack'];

  mealForm;

  constructor(
    private fb:FormBuilder,
    private router:Router,
    @Inject(PLATFORM_ID) platformId:Object
  ){
    this.isBrowser=isPlatformBrowser(platformId);

    this.mealForm=this.fb.nonNullable.group({
      mealType:['Breakfast' as MealType,[Validators.required]],
      name:['',[Validators.required,Validators.minLength(2)]],
      calories:[0,[Validators.required,Validators.min(1)]],
      protein:[0,[Validators.required,Validators.min(0)]],
      carbs:[0,[Validators.required,Validators.min(0)]],
      fats:[0,[Validators.required,Validators.min(0)]]
    });

    if(this.isBrowser){
      this.loadCurrentUser();
      this.loadOnboardingSummary();
      this.loadMeals();
      this.updateConsumed();
    }
  }

  get firstName():string{
    const fullName=(this.currentUser.fullName||'User').trim();
    return fullName.split(' ')[0]||'User';
  }

  get initials():string{
    const parts=(this.currentUser.fullName||'User').trim().split(' ').filter(Boolean).slice(0,2);
    return parts.map(part=>part[0].toUpperCase()).join('');
  }

  get currentWeightLabel():string{
    if(!this.summary?.step1){
      return '-';
    }

    const step1=this.summary.step1;

    if(step1.unitSystem==='imperial'){
      return `${step1.weightLbs} lbs`;
    }

    return `${step1.weightKg} kg`;
  }

  get goalWeightLabel():string{
    if(!this.summary?.step2){
      return '-';
    }

    return `${this.summary.step2.targetWeight} ${this.summary.step2.targetWeightUnit}`;
  }

  get goalLabel():string{
    const goal=this.summary?.step2?.goal;

    if(goal==='lose'){
      return 'Lose Weight';
    }

    if(goal==='gain'){
      return 'Gain Muscle';
    }

    return 'Maintain Weight';
  }

  get caloriesRemaining():number{
    return Math.max(this.dailyTargets.calories-this.consumed.calories,0);
  }

  get caloriesUsedPercent():number{
    return this.getPercent(this.consumed.calories,this.dailyTargets.calories);
  }

  get proteinPercent():number{
    return this.getPercent(this.consumed.protein,this.dailyTargets.protein);
  }

  get carbsPercent():number{
    return this.getPercent(this.consumed.carbs,this.dailyTargets.carbs);
  }

  get fatsPercent():number{
    return this.getPercent(this.consumed.fats,this.dailyTargets.fats);
  }

  private get mealsStorageKey():string{
    const emailKey=(this.currentUser.email||'guest').toLowerCase();
    return `dashboardMeals_${emailKey}`;
  }

  private loadCurrentUser():void{
    const raw=localStorage.getItem('authUser')||localStorage.getItem('pendingSignupUser');

    if(!raw){
      return;
    }

    try{
      this.currentUser=JSON.parse(raw) as AuthUser;
    }catch{
      this.currentUser={
        fullName:'User',
        email:''
      };
    }
  }

  private loadOnboardingSummary():void{
    const raw=localStorage.getItem('onboardingSummary')||sessionStorage.getItem('onboardingSummary');

    if(!raw){
      return;
    }

    try{
      this.summary=JSON.parse(raw) as OnboardingSummary;

      if(this.summary?.dailyTargets){
        this.dailyTargets=this.summary.dailyTargets;
      }
    }catch{
      this.summary=null;
    }
  }

  private loadMeals():void{
    const raw=localStorage.getItem(this.mealsStorageKey);

    if(!raw){
      this.meals=[];
      return;
    }

    try{
      this.meals=JSON.parse(raw) as DashboardMeal[];
    }catch{
      this.meals=[];
    }
  }

  private saveMeals():void{
    if(!this.isBrowser){
      return;
    }

    localStorage.setItem(this.mealsStorageKey,JSON.stringify(this.meals));
    this.updateConsumed();
  }

  private updateConsumed():void{
    this.consumed={
      calories:this.meals.reduce((sum,meal)=>sum+meal.calories,0),
      protein:this.meals.reduce((sum,meal)=>sum+meal.protein,0),
      carbs:this.meals.reduce((sum,meal)=>sum+meal.carbs,0),
      fats:this.meals.reduce((sum,meal)=>sum+meal.fats,0)
    };
  }

  private getPercent(current:number,target:number):number{
    if(!target||target<=0){
      return 0;
    }

    return Math.min(100,Math.round((current/target)*100));
  }

  getMealsByType(mealType:MealType):DashboardMeal[]{
    return this.meals.filter(meal=>meal.mealType===mealType);
  }

  hasAnyMeals():boolean{
    return this.meals.length>0;
  }

  toggleMealForm():void{
    this.showMealForm=!this.showMealForm;

    if(!this.showMealForm){
      this.cancelMealForm();
    }
  }

  startEdit(meal:DashboardMeal):void{
    this.editingMealId=meal.id;
    this.showMealForm=true;

    this.mealForm.setValue({
      mealType:meal.mealType,
      name:meal.name,
      calories:meal.calories,
      protein:meal.protein,
      carbs:meal.carbs,
      fats:meal.fats
    });
  }

  deleteMeal(mealId:string):void{
    this.meals=this.meals.filter(meal=>meal.id!==mealId);
    this.saveMeals();
  }

  saveMeal():void{
    if(this.mealForm.invalid){
      this.mealForm.markAllAsTouched();
      return;
    }

    const value=this.mealForm.getRawValue();

    if(this.editingMealId){
      this.meals=this.meals.map(meal=>{
        if(meal.id!==this.editingMealId){
          return meal;
        }

        return {
          ...meal,
          mealType:value.mealType,
          name:value.name.trim(),
          calories:Number(value.calories),
          protein:Number(value.protein),
          carbs:Number(value.carbs),
          fats:Number(value.fats)
        };
      });
    }else{
      const newMeal:DashboardMeal={
        id:crypto.randomUUID(),
        mealType:value.mealType,
        name:value.name.trim(),
        calories:Number(value.calories),
        protein:Number(value.protein),
        carbs:Number(value.carbs),
        fats:Number(value.fats),
        createdAt:new Date().toISOString()
      };

      this.meals=[...this.meals,newMeal];
    }

    this.sortMeals();
    this.saveMeals();
    this.cancelMealForm();
  }

  cancelMealForm():void{
    this.editingMealId=null;
    this.showMealForm=false;

    this.mealForm.reset({
      mealType:'Breakfast',
      name:'',
      calories:0,
      protein:0,
      carbs:0,
      fats:0
    });
  }

  private sortMeals():void{
    const orderMap:Record<MealType,number>={
      Breakfast:0,
      Lunch:1,
      Dinner:2,
      Snack:3
    };

    this.meals=[...this.meals].sort((a,b)=>orderMap[a.mealType]-orderMap[b.mealType]);
  }

  getMealEmoji(mealType:MealType):string{
    if(mealType==='Breakfast'){
      return '🍳';
    }

    if(mealType==='Lunch'){
      return '🥗';
    }

    if(mealType==='Dinner'){
      return '🍽️';
    }

    return '🍎';
  }

  getHealthTipTitle():string{
    const goal=this.summary?.step2?.goal;

    if(goal==='lose'){
      return 'Focus on protein and whole foods';
    }

    if(goal==='gain'){
      return 'Aim for consistent meals';
    }

    return 'Stay consistent with your targets';
  }

  getHealthTipText():string{
    const step3=this.summary?.step3;

    if(step3?.allergies?.length){
      return `Remember to avoid: ${step3.allergies.join(', ')}. Always check ingredient labels before adding meals.`;
    }

    if(step3?.foodsToAvoid?.trim()){
      return `You chose to avoid ${step3.foodsToAvoid}. Try building meals that match your preference every day.`;
    }

    return 'Start simple: add your meals regularly and compare them against your calories and macro targets.';
  }

  goToPlaceholder(action:string):void{
    if(this.isBrowser){
      alert(`${action} will be connected next.`);
    }
  }

  logout():void{
    if(this.isBrowser){
      localStorage.removeItem('authUser');
    }

    this.router.navigate(['/signin']);
  }
}