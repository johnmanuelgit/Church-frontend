// src/app/pages/admin-login/admin-login.component.ts
import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/admin/auth/auth.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';


@Component({
  selector: 'app-admin-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './admin-login.component.html',
  styleUrls: ['./admin-login.component.css']
})
export class AdminLoginComponent {
  username: string = '';
  password: string = '';
  errorMessage: string = '';
  successMessage: string = '';
  isLoading: boolean = false;
  isSubmitted: boolean = false;
  rememberMe: boolean = false;

  // Forgot-password state
  showForgotPassword = false;
  resetEmail = '';
  resetEmailSent = false;
  usernameError = '';
  passwordError = '';
  resetEmailError = '';
 
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  validateForm(): boolean {
    this.isSubmitted = true;
    this.usernameError = '';
    this.passwordError = '';
    let isValid = true;

    if (!this.username) {
      this.usernameError = 'Username is required';
      isValid = false;
    } else if (this.username.length < 3) {
      this.usernameError = 'Username must be at least 3 characters';
      isValid = false;
    }

    if (!this.password) {
      this.passwordError = 'Password is required';
      isValid = false;
    } else if (this.password.length < 6) {
      this.passwordError = 'Password must be at least 6 characters';
      isValid = false;
    }

    return isValid;
  }

login() {
  this.errorMessage = '';
  this.successMessage = '';

  if (!this.validateForm()) {
    return;
  }

  this.isLoading = true;

  this.authService.login(this.username, this.password, this.rememberMe).subscribe({
    next: (res) => {
      console.log('Login response:', res);

      if (res.status === 'success') {
          const user = res.user;
    localStorage.setItem('admin_user', JSON.stringify(user));
        this.successMessage = res.message;
      } else {
          const user = res.user;

        this.errorMessage = res.message || 'Login failed';
         sessionStorage.setItem('admin_user', JSON.stringify(user));
      }
 this.router.navigate(['/admindash']);
      this.isLoading = false; // ✅ Reset loading
    },
    error: (err) => {
      console.error('Login error:', err);
      this.errorMessage = err?.error?.message || 'Login failed';
      this.isLoading = false; // ✅ Reset loading
    }

    
  });
}

  toggleForgotPassword() {
    this.showForgotPassword = !this.showForgotPassword;
    this.resetEmail = '';
    this.resetEmailError = '';
    this.resetEmailSent = false;
    this.errorMessage = '';
    this.successMessage = '';
  }

  validateResetEmail(): boolean {
    this.resetEmailError = '';
    if (!this.resetEmail) {
      this.resetEmailError = 'Email is required';
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.resetEmail)) {
      this.resetEmailError = 'Please enter a valid email address';
      return false;
    }
    return true;
  }

  requestPasswordReset() {
    if (!this.validateResetEmail()) {
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.authService.forgotPassword(this.resetEmail)
      .subscribe({
        next: res => {
          this.isLoading = false;
          this.resetEmailSent = true;
          this.successMessage = res.message || 'Password reset instructions have been sent.';
        },
        error: err => {
          this.isLoading = false;
          this.errorMessage = err.error?.message || 'Failed to send reset email. Please try again.';
        }
      });
  }
}
