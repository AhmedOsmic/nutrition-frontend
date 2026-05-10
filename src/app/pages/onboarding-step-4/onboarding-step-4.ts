import {Component,Inject,PLATFORM_ID} from '@angular/core';
import {CommonModule,isPlatformBrowser} from '@angular/common';
import {Router} from '@angular/router';
import {ProfileService} from '../../services/profile';

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
  goal:'lose'|'maintain'|'gain';
  targetWeight:number;
  targetWeightUnit:'kg'|'lbs';
  mealsPerDay:number;
};

type Step3Data={
  allergies:string[];
  foodsToAvoid:string;
  preferredCuisine:string;
};

type DailyTargets={
  calories:number;
  protein:number;
  carbs:number;
  fats:number;
};

@Component({
  selector:'app-onboarding-step-4',
  imports:[CommonModule],
  templateUrl:'./onboarding-step-4.html',
  styleUrl:'./onboarding-step-4.css'
})
export class OnboardingStep4{
  private isBrowser:boolean;

  step1Data:Step1Data|null=null;
  step2Data:Step2Data|null=null;
  step3Data:Step3Data|null=null;

  goalLabel='-';
  allergiesLabel='None selected';
  foodsToAvoidLabel='None selected';
  preferredCuisineLabel='Not selected';

  dailyTargets:DailyTargets={
    calories:0,
    protein:0,
    carbs:0,
    fats:0
  };

  constructor(
    private router:Router,
    private profileService:ProfileService,
    @Inject(PLATFORM_ID) platformId:Object
  ){
    this.isBrowser=isPlatformBrowser(platformId);

    if(this.isBrowser){
      this.loadData();
    }
  }

  private loadData():void{
    const step1Raw=sessionStorage.getItem('onboardingStep1');
    const step2Raw=sessionStorage.getItem('onboardingStep2');
    const step3Raw=sessionStorage.getItem('onboardingStep3');

    if(!step1Raw||!step2Raw){
      this.router.navigate(['/onboarding']);
      return;
    }

    this.step1Data=JSON.parse(step1Raw) as Step1Data;
    this.step2Data=JSON.parse(step2Raw) as Step2Data;
    this.step3Data=step3Raw?JSON.parse(step3Raw) as Step3Data:null;

    this.goalLabel=this.getGoalLabel(this.step2Data.goal);
    this.allergiesLabel=this.step3Data?.allergies?.length?this.step3Data.allergies.join(', '):'None selected';
    this.foodsToAvoidLabel=this.step3Data?.foodsToAvoid?.trim()?this.step3Data.foodsToAvoid.trim():'None selected';
    this.preferredCuisineLabel=this.step3Data?.preferredCuisine?.trim()?this.step3Data.preferredCuisine:'Not selected';
    this.dailyTargets=this.calculateDailyTargets();
  }

  private getGoalLabel(goal:'lose'|'maintain'|'gain'):string{
    if(goal==='lose'){
      return 'Lose Weight';
    }

    if(goal==='gain'){
      return 'Gain Muscle';
    }

    return 'Maintain Weight';
  }

  private getWeightKg():number{
    if(!this.step1Data){
      return 0;
    }

    if(this.step1Data.unitSystem==='metric'){
      return Number(this.step1Data.weightKg||0);
    }

    return Number(this.step1Data.weightLbs||0)*0.45359237;
  }

  private getHeightCm():number{
    if(!this.step1Data){
      return 0;
    }

    if(this.step1Data.unitSystem==='metric'){
      return Number(this.step1Data.heightCm||0);
    }

    const totalInches=(Number(this.step1Data.heightFt||0)*12)+Number(this.step1Data.heightIn||0);
    return totalInches*2.54;
  }

  private getTargetWeightKg():number{
    if(!this.step2Data){
      return 0;
    }

    if(this.step2Data.targetWeightUnit==='kg'){
      return Number(this.step2Data.targetWeight||0);
    }

    return Number(this.step2Data.targetWeight||0)*0.45359237;
  }

  private getActivityFactor(activityLevel:string):number{
    switch(activityLevel){
      case 'Sedentary':
        return 1.2;
      case 'Lightly active':
        return 1.375;
      case 'Moderately active':
        return 1.55;
      case 'Very active':
        return 1.725;
      case 'Athlete / Extremely active':
        return 1.9;
      default:
        return 1.2;
    }
  }

  private getGenderConstant(gender:string):number{
    if(gender==='Male'){
      return 5;
    }

    if(gender==='Female'){
      return -161;
    }

    return -78;
  }

  private roundToNearestFive(value:number):number{
    return Math.max(0,Math.round(value/5)*5);
  }

  private roundToNearestFifty(value:number):number{
    return Math.max(1200,Math.round(value/50)*50);
  }

  private calculateDailyTargets():DailyTargets{
    if(!this.step1Data||!this.step2Data){
      return {
        calories:0,
        protein:0,
        carbs:0,
        fats:0
      };
    }

    const weightKg=this.getWeightKg();
    const heightCm=this.getHeightCm();
    const age=Number(this.step1Data.age);

    const bmr=(10*weightKg)+(6.25*heightCm)-(5*age)+this.getGenderConstant(this.step1Data.gender);
    const maintenanceCalories=bmr*this.getActivityFactor(this.step2Data.activityLevel);

    let adjustedCalories=maintenanceCalories;

    if(this.step2Data.goal==='lose'){
      adjustedCalories-=400;
    }else if(this.step2Data.goal==='gain'){
      adjustedCalories+=300;
    }

    const calories=this.roundToNearestFifty(adjustedCalories);

    let proteinPerKg=1.6;

    if(this.step2Data.goal==='lose'){
      proteinPerKg=1.8;
    }else if(this.step2Data.goal==='gain'){
      proteinPerKg=2;
    }

    const protein=this.roundToNearestFive(weightKg*proteinPerKg);
    const fats=this.roundToNearestFive((calories*0.25)/9);
    const carbCalories=calories-(protein*4)-(fats*9);
    const carbs=this.roundToNearestFive(carbCalories/4);

    return {
      calories,
      protein,
      carbs,
      fats
    };
  }

  goBack():void{
    this.router.navigate(['/onboarding-step-3']);
  }

  finishSetup():void{
    if(!this.isBrowser||!this.step1Data||!this.step2Data){
      return;
    }

    const finalSummary={
      step1:this.step1Data,
      step2:this.step2Data,
      step3:this.step3Data,
      dailyTargets:this.dailyTargets
    };

    const payload={
      unitSystem:this.step1Data.unitSystem,
      age:Number(this.step1Data.age),
      gender:this.step1Data.gender,
      heightCm:Number(this.getHeightCm().toFixed(2)),
      weightKg:Number(this.getWeightKg().toFixed(2)),
      activityLevel:this.step2Data.activityLevel,
      goal:this.step2Data.goal,
      targetWeightKg:Number(this.getTargetWeightKg().toFixed(2)),
      mealsPerDay:Number(this.step2Data.mealsPerDay),
      allergies:this.step3Data?.allergies?.join(', ')||'',
      foodsToAvoid:this.step3Data?.foodsToAvoid?.trim()||'',
      preferredCuisine:this.step3Data?.preferredCuisine?.trim()||'',
      targetCalories:this.dailyTargets.calories,
      targetProtein:this.dailyTargets.protein,
      targetCarbs:this.dailyTargets.carbs,
      targetFats:this.dailyTargets.fats
    };

    this.profileService.saveProfile(payload).subscribe({
      next:()=>{
        sessionStorage.setItem('onboardingSummary',JSON.stringify(finalSummary));
        localStorage.setItem('onboardingSummary',JSON.stringify(finalSummary));
        localStorage.setItem('hasCompletedOnboarding','true');
        this.router.navigate(['/dashboard']);
      },
      error:(error)=>{
        console.log('PROFILE SAVE ERROR:',error);
        alert(error?.error?.message||'Could not save profile.');
      }
    });
  }
}