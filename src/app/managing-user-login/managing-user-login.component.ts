import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../services/admin/auth/auth.service';
interface FormErrors {
  email?: string;
  password?: string;
  [key: string]: string | undefined;
}
@Component({
  selector: 'app-managing-user-login',
  standalone:true,
  imports: [CommonModule,FormsModule,RouterModule],
  templateUrl: './managing-user-login.component.html',
  styleUrl: './managing-user-login.component.css'
})
export class ManagingUserLoginComponent {
 email: string = '';
  password: string = '';
  errorMessage: string = '';
  isLoading: boolean = false;
  errors: FormErrors = {};
  showPassword: boolean = false;
  rememberMe: boolean = false;

  constructor(private authService: AuthService, private router: Router) {}

  validate(): boolean {
    this.errors = {};
    let isValid = true;

    if (!this.email.trim()) {
      this.errors['email'] = 'Email is required';
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email)) {
      this.errors['email'] = 'Please enter a valid email address';
      isValid = false;
    }

    if (!this.password.trim()) {
      this.errors['password'] = 'Password is required';
      isValid = false;
    } else if (this.password.length < 6) {
      this.errors['password'] = 'Password must be at least 6 characters';
      isValid = false;
    }

    return isValid;
  }

  login(): void {
    this.errorMessage = '';

    if (!this.validate()) {
      return;
    }

    this.isLoading = true;

    this.authService.userLogin(this.email, this.password).subscribe({
      next: (res) => {
        this.handleLoginResponse(res);
      },
      error: (err) => {
        this.handleLoginError(err);
      },
    });
  }

  private handleLoginResponse(res: any): void {
    this.isLoading = false;

    if (res?.status === 'success' && res?.token && res?.user) {
      const token = res.token;
      const userData = JSON.stringify(res.user);

      if (this.rememberMe) {
        localStorage.setItem('adminToken', token);
        localStorage.setItem('admin_user', userData);
      } else {
        sessionStorage.setItem('adminToken', token);
        sessionStorage.setItem('admin_user', userData);
      }

      this.router.navigate(['/admindash']);
    } else {
      this.errorMessage = res?.message || 'Invalid credentials';
    }
  }

  private handleLoginError(err: any): void {
    this.isLoading = false;
    this.errorMessage =
      err?.error?.message ||
      err?.message ||
      'Login failed. Please try again later.';
    console.error('Login error:', err);
  }

  resetForm(): void {
    this.email = '';
    this.password = '';
    this.errorMessage = '';
    this.errors = {};
  }

}
