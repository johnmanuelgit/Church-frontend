import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class ModuleAccessGuard implements CanActivate {
  constructor(private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot): boolean {
    const requiredModule = (route.data['module'] as string)?.trim();
    const userJson =
      sessionStorage.getItem('admin_user') ||
      localStorage.getItem('admin_user');

    if (!userJson) {
      this.router.navigate(['/adminlogin']);
      return false;
    }

    try {
      const user = JSON.parse(userJson);

      if (user.role === 'superadmin') {
        return true;
      }

      if (user.moduleAccess && typeof user.moduleAccess === 'object') {
        const hasAccess = !!user.moduleAccess[requiredModule];
        if (hasAccess) {
          return true;
        }
      }

      this.router.navigate(['/access-denied']);
      return false;
    } catch (e) {
      console.error('Error parsing user data:', e);
      this.router.navigate(['/adminlogin']);
      return false;
    }
  }
}
