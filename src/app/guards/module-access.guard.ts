// src/app/guards/module-access.guard.ts
import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class ModuleAccessGuard implements CanActivate {
  constructor(private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot): boolean {
    const requiredModule = route.data['module'] as string; // e.g. 'members', 'lcf'
    const userJson = sessionStorage.getItem('admin_user') || localStorage.getItem('admin_user');
    if (!userJson) {
      // Not logged in
      this.router.navigate(['/adminlogin']);
      return false;
    }

    const user = JSON.parse(userJson);
    const hasAccess = user.moduleAccess?.[requiredModule];
    if (!hasAccess && user.role !== 'superadmin') {
      // Redirect if no access
      this.router.navigate(['/unauthorized']); // or a “403” page
      return false;
    }
    return true;
  }
}
