import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Translation } from './services/translation';

export const authGuard: CanActivateFn = () => {
  const translationService = inject(Translation);
  const router = inject(Router);

  if (translationService.isLoggedIn()) {
    return true;
  }

  router.navigate(['/login']);
  return false;
};