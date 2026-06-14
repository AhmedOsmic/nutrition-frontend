import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { Router } from '@angular/router';
import { AccountProfile, AccountService } from '../../services/account';
import { Auth } from '../../services/auth';
import { fileToCompressedDataUrl } from '../../utils/image';

@Component({
  selector: 'app-edit-profile',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './edit-profile.html',
  styleUrl: './edit-profile.css'
})
export class EditProfile implements OnInit {
  profile: AccountProfile | null = null;
  loading = true;
  saving = false;
  message = '';
  error = '';
  showPassword = false;

  profileForm: FormGroup;
  passwordForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private accountService: AccountService,
    private auth: Auth,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {
    this.profileForm = this.fb.nonNullable.group({
      fullName: ['', [Validators.required, Validators.minLength(2)]],
      username: ['', [
        Validators.required,
        Validators.pattern(/^[a-zA-Z0-9._]{3,30}$/)
      ]],
      bio: ['', [Validators.maxLength(300)]],
      avatarUrl: [''],
      unitSystem: ['metric', Validators.required],
      age: [18, [Validators.required, Validators.min(13), Validators.max(120)]],
      gender: ['Male', Validators.required],
      heightCm: [170, [Validators.required, Validators.min(50), Validators.max(260)]],
      weightKg: [70, [Validators.required, Validators.min(25), Validators.max(400)]],
      activityLevel: ['Moderately active', Validators.required],
      goal: ['maintain', Validators.required],
      targetWeightKg: [70, [Validators.required, Validators.min(25), Validators.max(400)]],
      mealsPerDay: [3, [Validators.required, Validators.min(1), Validators.max(10)]],
      allergies: [''],
      foodsToAvoid: [''],
      preferredCuisine: [''],
      targetCalories: [2000, [Validators.required, Validators.min(800)]],
      targetProtein: [120, [Validators.required, Validators.min(0)]],
      targetCarbs: [200, [Validators.required, Validators.min(0)]],
      targetFats: [60, [Validators.required, Validators.min(0)]]
    });

    this.passwordForm = this.fb.nonNullable.group({
      currentPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.load();
  }

  get initials(): string {
    return (this.profileForm.controls['fullName'].value || 'U')
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part: string) => part[0].toUpperCase())
      .join('');
  }

  load(): void {
    this.loading = true;
    this.error = '';
    this.cdr.markForCheck();

    this.accountService.getProfile().subscribe({
      next: (profile) => {
        this.profile = profile;

        const username = profile.username || profile.email
          .split('@')[0]
          .replace(/[^a-zA-Z0-9._]/g, '')
          .slice(0, 30);

        this.profileForm.patchValue({
          ...profile,
          username,
          bio: profile.bio || '',
          avatarUrl: profile.avatarUrl || '',
          allergies: profile.allergies || '',
          foodsToAvoid: profile.foodsToAvoid || '',
          preferredCuisine: profile.preferredCuisine || ''
        });

        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.error = err?.error?.message || 'Could not load profile.';
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  async onPhotoSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) {
      return;
    }

    this.error = '';

    try {
      const dataUrl = await fileToCompressedDataUrl(file, 700, 0.75);
      this.profileForm.controls['avatarUrl'].setValue(dataUrl);
    } catch (error) {
      this.error = error instanceof Error
        ? error.message
        : 'Could not process photo.';
    } finally {
      input.value = '';
      this.cdr.markForCheck();
    }
  }

  save(): void {
    this.message = '';
    this.error = '';

    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      this.error = 'Please correct the highlighted profile fields.';
      this.cdr.markForCheck();
      return;
    }

    this.saving = true;
    this.cdr.markForCheck();

    this.accountService.updateProfile(this.profileForm.getRawValue()).subscribe({
      next: (profile) => {
        this.profile = profile;

        const current = this.auth.getCurrentUser();
        if (current) {
          localStorage.setItem('authUser', JSON.stringify({
            ...current,
            fullName: profile.fullName,
            username: profile.username,
            avatarUrl: profile.avatarUrl
          }));
        }

        this.message = 'Profile saved successfully.';
        this.saving = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.error = err?.error?.message || 'Could not save profile.';
        this.saving = false;
        this.cdr.markForCheck();
      }
    });
  }

  changePassword(): void {
    this.message = '';
    this.error = '';

    const value = this.passwordForm.getRawValue();

    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      this.cdr.markForCheck();
      return;
    }

    if (value.newPassword !== value.confirmPassword) {
      this.error = 'New passwords do not match.';
      this.cdr.markForCheck();
      return;
    }

    this.accountService
      .changePassword(value.currentPassword, value.newPassword)
      .subscribe({
        next: (response) => {
          this.message = response.message;
          this.passwordForm.reset();
          this.showPassword = false;
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.error = err?.error?.message || 'Could not change password.';
          this.cdr.markForCheck();
        }
      });
  }

  go(path: string): void {
    this.router.navigate([path]);
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/signin']);
  }
}
