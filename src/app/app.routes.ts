import {Routes} from '@angular/router';
import {Signin} from './pages/signin/signin';
import {Signup} from './pages/signup/signup';
import {Onboarding} from './pages/onboarding/onboarding';
import {OnboardingStep2} from './pages/onboarding-step-2/onboarding-step-2';
import {OnboardingStep3} from './pages/onboarding-step-3/onboarding-step-3';
import {OnboardingStep4} from './pages/onboarding-step-4/onboarding-step-4';
import {Dashboard} from './pages/dashboard/dashboard';

export const routes:Routes=[
  {path:'',redirectTo:'signin',pathMatch:'full'},
  {path:'signin',component:Signin},
  {path:'signup',component:Signup},
  {path:'onboarding',component:Onboarding},
  {path:'onboarding-step-2',component:OnboardingStep2},
  {path:'onboarding-step-3',component:OnboardingStep3},
  {path:'onboarding-step-4',component:OnboardingStep4},
  {path:'dashboard',component:Dashboard},
  {path:'**',redirectTo:'signin'}
];