import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OnboardingStep3 } from './onboarding-step-3';

describe('OnboardingStep3', () => {
  let component: OnboardingStep3;
  let fixture: ComponentFixture<OnboardingStep3>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OnboardingStep3],
    }).compileComponents();

    fixture = TestBed.createComponent(OnboardingStep3);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
