import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/admin/auth/auth.service';

@Component({
  selector: 'app-user-admin',
  standalone: true,
  imports: [CommonModule, FormsModule,RouterModule],
  templateUrl: './user-admin.component.html',
  styleUrls: ['./user-admin.component.css']
})
// In user-admin.component.ts
export class UserAdminComponent {
  email = '';
  password = '';
  errorMessage = '';
  isLoading = false;

  constructor(
    private authService: AuthService, 
    private router: Router
  ) {}

  login() {
    this.errorMessage = '';
    this.isLoading = true;

    // Use AuthService login method but call the user-login endpoint
    this.authService.userLogin(this.email, this.password).subscribe({
      next: (res) => {
        if (res?.status === 'success') {
          this.router.navigate(['/admindash']);
        } else {
          this.errorMessage = res?.message || 'Invalid response from server';
        }
        this.isLoading = false;
      },
      error: (err) => {
        this.errorMessage = err?.error?.message || 'Login failed';
        this.isLoading = false;
      }
    });
  }
}
