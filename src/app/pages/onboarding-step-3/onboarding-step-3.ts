import {Component} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormBuilder,FormControl,FormGroup,ReactiveFormsModule} from '@angular/forms';
import {Router} from '@angular/router';

@Component({
  selector:'app-onboarding-step-3',
  imports:[CommonModule,ReactiveFormsModule],
  templateUrl:'./onboarding-step-3.html',
  styleUrl:'./onboarding-step-3.css'
})
export class OnboardingStep3{
  allergies=[
    {label:'Peanuts',icon:'🥜'},
    {label:'Gluten',icon:'🌾'},
    {label:'Lactose',icon:'🥛'},
    {label:'Soy',icon:'🫛'},
    {label:'Eggs',icon:'🥚'},
    {label:'Seafood',icon:'🐟'},
    {label:'Tree Nuts',icon:'🌰'}
  ];

  selectedAllergies:string[]=[];

  cuisines=[
    'Balkan',
    'Mediterranean',
    'Italian',
    'Asian',
    'American',
    'Turkish',
    'Mexican'
  ];

  stepThreeForm:FormGroup<{
    foodsToAvoid:FormControl<string>;
    preferredCuisine:FormControl<string>;
  }>;

  constructor(
    private fb:FormBuilder,
    private router:Router
  ){
    this.stepThreeForm=this.fb.nonNullable.group({
      foodsToAvoid:[''],
      preferredCuisine:['']
    });

    const savedStep3=sessionStorage.getItem('onboardingStep3');

    if(savedStep3){
      const step3Data=JSON.parse(savedStep3);

      this.selectedAllergies=Array.isArray(step3Data.allergies)?step3Data.allergies:[];

      this.stepThreeForm.patchValue({
        foodsToAvoid:step3Data.foodsToAvoid||'',
        preferredCuisine:step3Data.preferredCuisine||''
      });
    }
  }

  toggleAllergy(allergy:string):void{
    if(this.selectedAllergies.includes(allergy)){
      this.selectedAllergies=this.selectedAllergies.filter(a=>a!==allergy);
    }else{
      this.selectedAllergies=[...this.selectedAllergies,allergy];
    }
  }

  isSelected(allergy:string):boolean{
    return this.selectedAllergies.includes(allergy);
  }

  goBack():void{
    this.router.navigate(['/onboarding-step-2']);
  }

  goNext():void{
    const payload={
      allergies:this.selectedAllergies,
      foodsToAvoid:this.stepThreeForm.controls.foodsToAvoid.value,
      preferredCuisine:this.stepThreeForm.controls.preferredCuisine.value
    };

    sessionStorage.setItem('onboardingStep3',JSON.stringify(payload));
    console.log('Onboarding Step 3 Data:',payload);
    this.router.navigate(['/onboarding-step-4']);
  }
}