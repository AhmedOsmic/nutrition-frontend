import { isPlatformBrowser } from '@angular/common';
import { inject, PLATFORM_ID } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Auth } from '../services/auth';

export const authGuard: CanActivateFn = () => {
  const platformId = inject(PLATFORM_ID);

  // SSR cannot read localStorage. The browser guard performs the real check.
  if (!isPlatformBrowser(platformId)) {
    return true;
  }

  const auth = inject(Auth);
  const router = inject(Router);

  return auth.isAuthenticated()
    ? true
    : router.createUrlTree(['/signin']);
};
