import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

import { environment } from '../../../environments/environment';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const token = authService.getToken();
  const apiUrl = environment.apiUrl;
  const isProtectedAdminApiRequest =
    req.url.startsWith(`${apiUrl}/company`) || req.url.startsWith('/api/company');

  const authorizedRequest =
    token && isProtectedAdminApiRequest
      ? req.clone({
          setHeaders: {
            Authorization: `Bearer ${token}`
          }
        })
      : req;

  return next(authorizedRequest).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        authService.logout();
        void router.navigate(['/admin/login']);
      }

      return throwError(() => error);
    })
  );
};
