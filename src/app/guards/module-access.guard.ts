import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class ModuleAccessGuard implements CanActivate {
  constructor(private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot): boolean {
    const requiredModule = route.data['module'] as string;
    const userJson =
      sessionStorage.getItem('admin_user') ||
      localStorage.getItem('admin_user');

    if (!userJson) {
      this.router.navigate(['/adminlogin']);
      return false;
    }

    const user = JSON.parse(userJson);

    if (user.role === 'superadmin') {
      return true;
    }

    const hasAccess = user.moduleAccess?.[requiredModule];
    if (!hasAccess) {
      this.router.navigate(['']);
      return false;
    }

    return true;
  }
}
