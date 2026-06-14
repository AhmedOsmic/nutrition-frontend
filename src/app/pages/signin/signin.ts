import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Auth } from '../../services/auth';
import { ProfileService } from '../../services/profile';

@Component({
  selector: 'app-signin',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink
  ],
  templateUrl: './signin.html',
  styleUrl: './signin.css'
})
export class Signin {
  showPassword = false;
  submitted = false;
  successMessage = '';
  errorMessage = '';

  signInForm;

  constructor(
    private fb: FormBuilder,
    private auth: Auth,
    private profileService: ProfileService,
    private router: Router
  ) {
    this.signInForm = this.fb.nonNullable.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]]
    });
  }

  get email() {
    return this.signInForm.controls.email;
  }

  get password() {
    return this.signInForm.controls.password;
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  onSubmit(): void {
    this.submitted = true;
    this.successMessage = '';
    this.errorMessage = '';

    if (this.signInForm.invalid) {
      this.signInForm.markAllAsTouched();
      return;
    }

    this.auth.login({
      email: this.email.value.trim(),
      password: this.password.value
    }).subscribe({
      next: (response) => {
        if (!response.token) {
          this.errorMessage =
            'Login succeeded, but no authentication token was returned.';
          return;
        }

        this.auth.saveSession(response);
        this.successMessage = response.message || 'Login successful.';

        this.profileService.getProfile().subscribe({
          next: (profile) => {
            localStorage.setItem(
              'hasCompletedOnboarding',
              String(profile.onboardingCompleted)
            );

            setTimeout(() => {
              this.router.navigate(['/dashboard']);
            }, 700);
          },
          error: () => {
            localStorage.removeItem('hasCompletedOnboarding');
            localStorage.removeItem('onboardingSummary');

            setTimeout(() => {
              this.router.navigate(['/onboarding']);
            }, 700);
          }
        });
      },
      error: (error) => {
        this.auth.logout();
        this.errorMessage = error?.error?.message || 'Login failed.';
        console.error('LOGIN ERROR:', error);
      }
    });
  }
}
