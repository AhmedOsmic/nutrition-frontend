import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector:'app-onboarding',
  imports:[CommonModule,ReactiveFormsModule],
  templateUrl:'./onboarding.html',
  styleUrl:'./onboarding.css'
})
export class Onboarding{
  submitted=false;
  errorMessage='';

  genderOptions=['Male','Female','Prefer not to say'];

  ageOptions:number[]=[];
  metricHeightOptions:number[]=[];
  metricWeightOptions:number[]=[];
  imperialFeetOptions:number[]=[];
  imperialInchOptions:number[]=[];
  imperialWeightOptions:number[]=[];

  onboardingForm;

  constructor(
    private fb:FormBuilder,
    private router:Router
  ){
    this.ageOptions=this.createRange(16,110);
    this.metricHeightOptions=this.createRange(140,220);
    this.metricWeightOptions=this.createRange(40,150);
    this.imperialFeetOptions=this.createRange(4,7);
    this.imperialInchOptions=this.createRange(0,11);
    this.imperialWeightOptions=this.createRange(90,330);

    this.onboardingForm=this.fb.group({
      unitSystem:['metric',[Validators.required]],
      age:['',[Validators.required]],
      gender:['',[Validators.required]],

      heightCm:[''],
      weightKg:[''],

      heightFt:[''],
      heightIn:[''],
      weightLbs:['']
    });
  }

  createRange(start:number,end:number):number[]{
    return Array.from({length:end-start+1},(_,i)=>start+i);
  }

  get unitSystem(){
    return this.onboardingForm.controls.unitSystem;
  }

  get age(){
    return this.onboardingForm.controls.age;
  }

  get gender(){
    return this.onboardingForm.controls.gender;
  }

  get heightCm(){
    return this.onboardingForm.controls.heightCm;
  }

  get weightKg(){
    return this.onboardingForm.controls.weightKg;
  }

  get heightFt(){
    return this.onboardingForm.controls.heightFt;
  }

  get heightIn(){
    return this.onboardingForm.controls.heightIn;
  }

  get weightLbs(){
    return this.onboardingForm.controls.weightLbs;
  }

  isMetric():boolean{
    return this.unitSystem.value==='metric';
  }

  isImperial():boolean{
    return this.unitSystem.value==='imperial';
  }

  selectUnit(unit:'metric'|'imperial'):void{
    this.unitSystem.setValue(unit);

    if(unit==='imperial'&&!this.heightFt.value){
      this.heightFt.setValue('5');
    }

    this.ensureImperialHeightInRange();
    this.errorMessage='';
  }

  ensureImperialHeightInRange():void{
    if(!this.isImperial()){
      return;
    }

    const ft=Number(this.heightFt.value);
    const inch=Number(this.heightIn.value);

    if(!ft){
      return;
    }

    if(ft===4&&(!inch||inch<6)){
      this.heightIn.setValue('6');
    }

    if(ft===7&&inch>2){
      this.heightIn.setValue('2');
    }
  }

  getAvailableImperialInches():number[]{
    const ft=Number(this.heightFt.value);

    if(ft===4){
      return this.createRange(6,11);
    }

    if(ft===7){
      return this.createRange(0,2);
    }

    return this.createRange(0,11);
  }

  onFeetChange():void{
    this.ensureImperialHeightInRange();
  }

  onSubmit():void{
    this.submitted=true;
    this.errorMessage='';

    if(this.unitSystem.invalid||this.age.invalid||this.gender.invalid){
      this.onboardingForm.markAllAsTouched();
      return;
    }

    if(this.isMetric()){
      if(!this.heightCm.value||!this.weightKg.value){
        this.errorMessage='Please select your height and current weight.';
        return;
      }

      const payload={
        unitSystem:'metric',
        age:Number(this.age.value),
        gender:this.gender.value,
        heightCm:Number(this.heightCm.value),
        weightKg:Number(this.weightKg.value)
      };

      sessionStorage.setItem('onboardingStep1',JSON.stringify(payload));
      console.log('Saved step 1:',payload);
      this.router.navigate(['/onboarding-step-2']);
      return;
    }

    if(this.isImperial()){
      if(!this.heightFt.value||!this.heightIn.value||!this.weightLbs.value){
        this.errorMessage='Please select your height and current weight.';
        return;
      }

      const payload={
        unitSystem:'imperial',
        age:Number(this.age.value),
        gender:this.gender.value,
        heightFt:Number(this.heightFt.value),
        heightIn:Number(this.heightIn.value),
        weightLbs:Number(this.weightLbs.value)
      };

      sessionStorage.setItem('onboardingStep1',JSON.stringify(payload));
      console.log('Saved step 1:',payload);
      this.router.navigate(['/onboarding-step-2']);
    }
  }
}