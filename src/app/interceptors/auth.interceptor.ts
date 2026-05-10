import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { Auth } from '../services/auth';

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const auth = inject(Auth);
  const router = inject(Router);

  const isApiRequest = request.url.includes('/api/');
  const isPublicAuthRequest =
    request.url.includes('/api/auth/login') ||
    request.url.includes('/api/auth/signup');

  const token = auth.getToken();

  const outgoingRequest =
    isApiRequest && !isPublicAuthRequest && token
      ? request.clone({
          setHeaders: {
            Authorization: `Bearer ${token}`
          }
        })
      : request;

  return next(outgoingRequest).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && !isPublicAuthRequest) {
        auth.logout();
        void router.navigate(['/signin']);
      }

      return throwError(() => error);
    })
  );
};
