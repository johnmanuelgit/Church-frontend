// src/app/admin/admin-login/admin-login.component.ts
import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, RouterModule } from '@angular/router';
import { AuthService } from '../../services/admin/auth/auth.service';


@Component({
  selector: 'app-admin-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, RouterLink],
  templateUrl: './admin-login.component.html',
  styleUrl: './admin-login.component.css'
})
export class AdminLoginComponent {
  username: string = '';
  password: string = '';
  errorMessage: string = '';
  successMessage: string = '';
  
  // Form states
  isLoading: boolean = false;
  isSubmitted: boolean = false;
  rememberMe: boolean = false;
  
  // Forgot password state
  showForgotPassword: boolean = false;
  resetEmail: string = '';
  resetEmailSent: boolean = false;

  // Validation properties
  usernameError: string = '';
  passwordError: string = '';
  resetEmailError: string = '';

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  validateForm(): boolean {
    this.isSubmitted = true;
    this.usernameError = '';
    this.passwordError = '';
    let isValid = true;

    // Validate username
    if (!this.username) {
      this.usernameError = 'Username is required';
      isValid = false;
    } else if (this.username.length < 3) {
      this.usernameError = 'Username must be at least 3 characters';
      isValid = false;
    }

    // Validate password
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

    // Validate form first
    if (!this.validateForm()) {
      return;
    }

    this.isLoading = true;

    this.authService.login(this.username, this.password, this.rememberMe)
      .subscribe({
        next: (res) => {
          this.isLoading = false;
          this.successMessage = res.message || 'Login successful';
          // Navigate to dashboard after successful login
          this.router.navigate(['/admindash']).then(() => {
            console.log('Navigated to /admindash');
          });
          
    
        },
        error: (err) => {
          this.isLoading = false;
          this.errorMessage = err.error?.message || 'Login failed. Please check your credentials.';
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
    
    // Basic email validation
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
        next: (res) => {
          this.isLoading = false;
          this.resetEmailSent = true;
          this.successMessage = res.message || 'Password reset instructions have been sent to your email';
        },
        error: (err) => {
          this.isLoading = false;
          this.errorMessage = err.error?.message || 'Failed to send reset email. Please try again.';
        }
      });
  }
}