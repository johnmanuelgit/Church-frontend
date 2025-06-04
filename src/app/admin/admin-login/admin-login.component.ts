// src/app/pages/admin-login/admin-login.component.ts
import { Component, OnInit } from '@angular/core';
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
export class AdminLoginComponent implements OnInit {
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

  ngOnInit() {
    // Check if user is already authenticated
    this.authService.isAuthenticated().subscribe(isAuth => {
      if (isAuth) {
        this.router.navigate(['/admindash']);
      }
    });

    // Load remember me preference
    this.loadRememberMeData();
  }

  private loadRememberMeData() {
    const rememberMe = localStorage.getItem('admin_remember');
    if (rememberMe === 'true') {
      const savedUser = localStorage.getItem('admin_user');
      if (savedUser) {
        try {
          const userData = JSON.parse(savedUser);
          this.username = userData.username || '';
          this.rememberMe = true;
        } catch (e) {
          console.error('Error loading saved user data:', e);
        }
      }
    }
  }

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
          this.successMessage = res.message;
          
          // Small delay to show success message before redirect
          setTimeout(() => {
            this.router.navigate(['/admindash']);
          }, 1000);
        } else {
          this.errorMessage = res.message || 'Login failed';
        }

        this.isLoading = false;
      },
      error: (err) => {
        console.error('Login error:', err);
        this.errorMessage = err?.error?.message || 'Login failed. Please check your credentials.';
        this.isLoading = false;
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

    this.authService.forgotPassword(this.resetEmail).subscribe({
      next: (res) => {
        console.log('Forgot password response:', res);
        this.isLoading = false;
        
        if (res.status === 'success') {
          this.resetEmailSent = true;
          this.successMessage = res.message || 'Password reset instructions have been sent to your email.';
        } else {
          this.errorMessage = res.message || 'Failed to send reset email.';
        }
      },
      error: (err) => {
        console.error('Forgot password error:', err);
        this.isLoading = false;
        this.errorMessage = err.error?.message || 'Failed to send reset email. Please try again.';
      }
    });
  }

  // Helper method to reset the forgot password form
  resetForgotPasswordForm() {
    this.resetEmail = '';
    this.resetEmailError = '';
    this.resetEmailSent = false;
    this.errorMessage = '';
    this.successMessage = '';
  }

  // Method to handle "try again" link in success message
  tryAgain() {
    this.resetEmailSent = false;
    this.resetEmail = '';
  }
}