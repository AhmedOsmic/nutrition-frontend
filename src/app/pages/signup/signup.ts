import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import {
  Router,
  RouterLink
} from '@angular/router';
import { Auth } from '../../services/auth';

@Component({
  selector: 'app-signup',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink
  ],
  templateUrl: './signup.html',
  styleUrl: './signup.css'
})
export class Signup {
  showPassword = false;
  showConfirmPassword = false;
  submitted = false;
  successMessage = '';
  errorMessage = '';

  signUpForm;

  constructor(
    private fb: FormBuilder,
    private auth: Auth,
    private router: Router
  ) {
    this.signUpForm = this.fb.nonNullable.group({
      fullName: [
        '',
        [
          Validators.required,
          Validators.minLength(2)
        ]
      ],
      email: [
        '',
        [
          Validators.required,
          Validators.email
        ]
      ],
      password: [
        '',
        [
          Validators.required,
          Validators.minLength(8)
        ]
      ],
      confirmPassword: [
        '',
        [
          Validators.required
        ]
      ]
    });
  }

  get fullName() {
    return this.signUpForm.controls.fullName;
  }

  get email() {
    return this.signUpForm.controls.email;
  }

  get password() {
    return this.signUpForm.controls.password;
  }

  get confirmPassword() {
    return this.signUpForm.controls.confirmPassword;
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPassword(): void {
    this.showConfirmPassword =
      !this.showConfirmPassword;
  }

  onSubmit(): void {
    this.submitted = true;
    this.successMessage = '';
    this.errorMessage = '';

    if (this.signUpForm.invalid) {
      this.signUpForm.markAllAsTouched();
      return;
    }

    if (
      this.password.value !==
      this.confirmPassword.value
    ) {
      this.errorMessage =
        'Passwords do not match.';
      return;
    }

    this.auth.signup({
      fullName: this.fullName.value.trim(),
      email: this.email.value.trim(),
      password: this.password.value
    }).subscribe({
      next: (response) => {
        if (!response.token) {
          this.errorMessage =
            'Signup succeeded, but no authentication token was returned.';
          return;
        }

        this.auth.saveSession(response);

        localStorage.removeItem(
          'pendingSignupUser'
        );
        localStorage.removeItem(
          'hasCompletedOnboarding'
        );
        localStorage.removeItem(
          'onboardingSummary'
        );

        this.successMessage =
          response.message ||
          'Signup successful.';

        setTimeout(() => {
          this.router.navigate(['/onboarding']);
        }, 1000);
      },

      error: (error) => {
        this.errorMessage =
          error?.error?.message ||
          'Signup failed.';

        console.error(
          'SIGNUP ERROR:',
          error
        );
      }
    });
  }
}