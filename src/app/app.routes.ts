import { Routes } from '@angular/router';
import { Landing } from './pages/landing/landing';
import { Signin } from './pages/signin/signin';
import { Signup } from './pages/signup/signup';
import { Onboarding } from './pages/onboarding/onboarding';
import { OnboardingStep2 } from './pages/onboarding-step-2/onboarding-step-2';
import { OnboardingStep3 } from './pages/onboarding-step-3/onboarding-step-3';
import { OnboardingStep4 } from './pages/onboarding-step-4/onboarding-step-4';
import { Dashboard } from './pages/dashboard/dashboard';
import { EditProfile } from './pages/edit-profile/edit-profile';
import { Friends } from './pages/friends/friends';
import { Posts } from './pages/posts/posts';
import { Diary } from './pages/diary/diary';
import { Recipes } from './pages/recipes/recipes';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', component: Landing },
  { path: 'signin', component: Signin },
  { path: 'signup', component: Signup },
  { path: 'onboarding', component: Onboarding, canActivate: [authGuard] },
  { path: 'onboarding-step-2', component: OnboardingStep2, canActivate: [authGuard] },
  { path: 'onboarding-step-3', component: OnboardingStep3, canActivate: [authGuard] },
  { path: 'onboarding-step-4', component: OnboardingStep4, canActivate: [authGuard] },
  { path: 'dashboard', component: Dashboard, canActivate: [authGuard] },
  { path: 'profile', component: EditProfile, canActivate: [authGuard] },
  { path: 'friends', component: Friends, canActivate: [authGuard] },
  { path: 'posts', component: Posts, canActivate: [authGuard] },
  { path: 'diary', component: Diary, canActivate: [authGuard] },
  { path: 'recipes', component: Recipes, canActivate: [authGuard] },
  { path: '**', redirectTo: '' }
];
