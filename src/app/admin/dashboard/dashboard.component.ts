import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import {  RouterLink, RouterModule } from '@angular/router';
import { AuthService } from '../../services/admin/auth/auth.service';
import { AdminNavComponent } from '../admin-nav/admin-nav.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, RouterLink, AdminNavComponent],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
})
export class DashboardComponent implements OnInit {
  currentTime = '';
  user: any = null;
  constructor(private authService: AuthService) {}
  ngOnInit(): void {
    const now = new Date();
    this.currentTime = now.toLocaleTimeString();
    const userJson =
      sessionStorage.getItem('admin_user') ||
      localStorage.getItem('admin_user');
    this.user = userJson ? JSON.parse(userJson) : null;
  }

  isSuperAdmin(): boolean {
    return this.user?.role === 'superadmin';
  }

  isAdmin(): boolean {
    return this.user?.role === 'admin';
  }

  hasModuleAccess(moduleName: string): boolean {
    if (this.isSuperAdmin()) return true;
    return this.user?.moduleAccess?.[moduleName] === true;
  }
}
