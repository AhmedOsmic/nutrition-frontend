import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';

type GoalType='lose'|'maintain'|'gain';

@Component({
  selector:'app-onboarding-step-2',
  standalone:true,
  imports:[CommonModule,ReactiveFormsModule],
  templateUrl:'./onboarding-step-2.html',
  styleUrl:'./onboarding-step-2.css'
})
export class OnboardingStep2{
  successMessage='';

  activityOptions=[
    'Sedentary',
    'Lightly active',
    'Moderately active',
    'Very active',
    'Athlete / Extremely active'
  ];

  mealsOptions=[2,3,4,5,6];

  metricTargetWeightOptions:number[]=[];
  imperialTargetWeightOptions:number[]=[];

  unitSystem:'metric'|'imperial'='metric';

  step2Form;

  constructor(
    private fb:FormBuilder,
    private router:Router
  ){
    const step1Raw=sessionStorage.getItem('onboardingStep1');

    if(step1Raw){
      const step1Data=JSON.parse(step1Raw);
      this.unitSystem=step1Data.unitSystem||'metric';
    }

    this.metricTargetWeightOptions=this.createRange(40,150);
    this.imperialTargetWeightOptions=this.createRange(90,330);

    this.step2Form=this.fb.group({
      activityLevel:['',[Validators.required]],
      goal:['maintain' as GoalType,[Validators.required]],
      targetWeightKg:[''],
      targetWeightLbs:[''],
      mealsPerDay:['',[Validators.required]]
    });
  }

  createRange(start:number,end:number):number[]{
    return Array.from({length:end-start+1},(_,i)=>start+i);
  }

  get activityLevel(){
    return this.step2Form.controls.activityLevel;
  }

  get goal(){
    return this.step2Form.controls.goal;
  }

  get targetWeightKg(){
    return this.step2Form.controls.targetWeightKg;
  }

  get targetWeightLbs(){
    return this.step2Form.controls.targetWeightLbs;
  }

  get mealsPerDay(){
    return this.step2Form.controls.mealsPerDay;
  }

  isMetric():boolean{
    return this.unitSystem==='metric';
  }

  isImperial():boolean{
    return this.unitSystem==='imperial';
  }

  selectGoal(goalValue:GoalType):void{
    this.goal.setValue(goalValue);
  }

  goBack():void{
    this.router.navigate(['/onboarding']);
  }

  onSubmit():void{
    const selectedTargetWeight=this.isMetric()?this.targetWeightKg.value:this.targetWeightLbs.value;

    if(
      this.activityLevel.invalid||
      this.goal.invalid||
      this.mealsPerDay.invalid||
      selectedTargetWeight===''||
      selectedTargetWeight===null
    ){
      this.activityLevel.markAsTouched();
      this.goal.markAsTouched();
      this.mealsPerDay.markAsTouched();

      if(this.isMetric()){
        this.targetWeightKg.markAsTouched();
      }else{
        this.targetWeightLbs.markAsTouched();
      }

      return;
    }

    const payload={
      activityLevel:this.activityLevel.value,
      goal:this.goal.value,
      targetWeight:selectedTargetWeight,
      targetWeightUnit:this.isMetric()?'kg':'lbs',
      mealsPerDay:this.mealsPerDay.value
    };

    sessionStorage.setItem('onboardingStep2',JSON.stringify(payload));
    console.log('Step 1:',JSON.parse(sessionStorage.getItem('onboardingStep1')||'{}'));
    console.log('Step 2:',payload);

    this.successMessage='Step 2 is working.';
    this.router.navigate(['/onboarding-step-3']);
  }
}