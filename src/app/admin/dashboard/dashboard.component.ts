import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router, RouterLink, RouterModule } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  currentTime = '';
  user: any = null;
constructor (private router:Router){}
  ngOnInit(): void {
    const now = new Date();
    this.currentTime = now.toLocaleTimeString();

    // ✅ Load user from sessionStorage or localStorage
    const userJson = sessionStorage.getItem('admin_user') || localStorage.getItem('admin_user');
    this.user = userJson ? JSON.parse(userJson) : null;
  }

  // ✅ Role checkers
  isSuperAdmin(): boolean {
    return this.user?.role === 'superadmin';
  }

  isAdmin(): boolean {
    return this.user?.role === 'admin';
  }

  // ✅ Module access check (assuming user.moduleAccess is an object like { dashboard: true, users: false })
  hasModuleAccess(moduleName: string): boolean {
    if (this.isSuperAdmin()) return true;
    return this.user?.moduleAccess?.[moduleName] === true;
  }

   logout(): void {
this.clear()
    this.router.navigate(['/adminlogin']); 
  }
  clear(){
    sessionStorage.removeItem('admin_user');
    localStorage.removeItem('admin_user');
    localStorage.removeItem('admin_remember');
  }

}
