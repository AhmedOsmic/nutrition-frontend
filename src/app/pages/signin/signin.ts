import {Component} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormBuilder,ReactiveFormsModule,Validators} from '@angular/forms';
import {Router,RouterLink} from '@angular/router';
import {Auth} from '../../services/auth';

@Component({
  selector:'app-signin',
  imports:[CommonModule,ReactiveFormsModule,RouterLink],
  templateUrl:'./signin.html',
  styleUrl:'./signin.css'
})
export class Signin{
  showPassword=false;
  submitted=false;
  successMessage='';
  errorMessage='';

  signInForm;

  constructor(
    private fb:FormBuilder,
    private auth:Auth,
    private router:Router
  ){
    this.signInForm=this.fb.nonNullable.group({
      email:['',[Validators.required,Validators.email]],
      password:['',[Validators.required,Validators.minLength(8)]]
    });
  }

  get email(){
    return this.signInForm.controls.email;
  }

  get password(){
    return this.signInForm.controls.password;
  }

  togglePassword():void{
    this.showPassword=!this.showPassword;
  }

  onSubmit():void{
    this.submitted=true;
    this.successMessage='';
    this.errorMessage='';

    if(this.signInForm.invalid){
      this.signInForm.markAllAsTouched();
      return;
    }

    this.auth.login({
      email:this.email.value,
      password:this.password.value
    }).subscribe({
      next:(response:any)=>{
        const existingUserRaw=localStorage.getItem('authUser')||localStorage.getItem('pendingSignupUser');
        let existingUser:{fullName?:string;email?:string}={};

        if(existingUserRaw){
          try{
            existingUser=JSON.parse(existingUserRaw);
          }catch{
            existingUser={};
          }
        }

        const userData={
          fullName:response?.fullName||existingUser.fullName||this.email.value.split('@')[0],
          email:response?.email||this.email.value
        };

        localStorage.setItem('authUser',JSON.stringify(userData));

        this.successMessage=response.message||'Login successful.';

        setTimeout(()=>{
          const hasOnboarding=localStorage.getItem('hasCompletedOnboarding')==='true'||!!localStorage.getItem('onboardingSummary');

          if(hasOnboarding){
            this.router.navigate(['/dashboard']);
          }else{
            this.router.navigate(['/onboarding']);
          }
        },700);
      },
      error:(error)=>{
        this.errorMessage=error?.error?.message||'Login failed.';
        console.log('LOGIN ERROR:',error);
      }
    });
  }
}