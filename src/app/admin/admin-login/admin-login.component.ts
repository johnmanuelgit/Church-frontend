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
  styleUrls: ['./admin-login.component.css'],
})
export class AdminLoginComponent implements OnInit {
  username: string = '';
  password: string = '';
  rememberMe: boolean = false;
  errorMessage: string = '';
  successMessage: string = '';
  isLoading: boolean = false;
  isSubmitted: boolean = false;
  usernameError: string = '';
  passwordError: string = '';
  showForgotPassword: boolean = false;
  resetEmail: string = '';
  resetEmailSent: boolean = false;
  resetEmailError: string = '';
  showForgotUsername: boolean = false;
  usernameRecoveryEmail: string = '';
  usernameRecoveryEmailError: string = '';
  usernameRecoveryEmailSent: boolean = false;

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit() {
    this.checkAuthentication();
    this.loadRememberMeData();
  }

  private checkAuthentication(): void {
    this.authService.isAuthenticated().subscribe((isAuth) => {
      if (isAuth) {
        this.router.navigate(['/admindash']);
      }
    });
  }

  private loadRememberMeData(): void {
    const rememberMe = localStorage.getItem('admin_remember') === 'true';
    if (rememberMe) {
      const user = this.authService.getCurrentUser();
      if (user) {
        this.username = user.username || '';
        this.rememberMe = true;
      }
    }
  }

  validateForm(): boolean {
    this.isSubmitted = true;
    this.clearErrors();

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

  login(): void {
    if (!this.validateForm()) return;

    this.isLoading = true;
    this.clearMessages();

    this.authService
      .login(this.username, this.password, this.rememberMe)
      .subscribe({
        next: (res) => {
          this.handleLoginSuccess(res);
        },
        error: (err) => {
          this.handleLoginError(err);
        },
      });
  }

  private handleLoginSuccess(res: any): void {
    this.isLoading = false;

    if (res.status === 'success') {
      this.successMessage = res.message || 'Login successful';
      setTimeout(() => this.router.navigate(['/admindash']), 1000);
    } else {
      this.errorMessage = res.message || 'Login failed';
    }
  }

  private handleLoginError(err: any): void {
    this.isLoading = false;
    console.error('Login error:', err);
    this.errorMessage =
      err?.error?.message || 'Login failed. Please check your credentials.';
  }

  toggleForgotPassword(): void {
    this.showForgotPassword = !this.showForgotPassword;
    this.showForgotUsername = false; // Hide username recovery when showing password reset
    this.resetEmail = '';
    this.resetEmailSent = false;
    this.clearMessages();
    this.clearErrors();
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

  requestPasswordReset(): void {
    if (!this.validateResetEmail()) return;

    this.isLoading = true;
    this.clearMessages();

    this.authService.forgotPassword(this.resetEmail).subscribe({
      next: (res) => {
        this.handleResetSuccess(res);
      },
      error: (err) => {
        this.handleResetError(err);
      },
    });
  }

  private handleResetSuccess(res: any): void {
    this.isLoading = false;

    if (res.status === 'success') {
      this.resetEmailSent = true;
      this.successMessage =
        res.message || 'Password reset instructions sent to your email';
    } else {
      this.errorMessage = res.message || 'Failed to send reset email';
    }
  }

  private handleResetError(err: any): void {
    this.isLoading = false;
    console.error('Forgot password error:', err);
    this.errorMessage =
      err.error?.message || 'Failed to send reset email. Please try again.';
  }

  resetForgotPasswordForm(): void {
    this.resetEmail = '';
    this.resetEmailSent = false;
    this.clearMessages();
    this.clearErrors();
  }

  tryAgain(): void {
    this.resetEmailSent = false;
    this.resetEmail = '';
    this.clearMessages();
  }

  toggleForgotUsername(): void {
    this.showForgotUsername = !this.showForgotUsername;
    this.showForgotPassword = false;
    this.usernameRecoveryEmail = '';
    this.usernameRecoveryEmailSent = false;
    this.clearMessages();
    this.clearErrors();
  }

  
  validateUsernameRecoveryEmail(): boolean {
    this.usernameRecoveryEmailError = '';

    if (!this.usernameRecoveryEmail) {
      this.usernameRecoveryEmailError = 'Email is required';
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.usernameRecoveryEmail)) {
      this.usernameRecoveryEmailError = 'Please enter a valid email address';
      return false;
    }

    return true;
  }


  requestUsername(): void {
    if (!this.validateUsernameRecoveryEmail()) return;

    this.isLoading = true;
    this.clearMessages();

    this.authService.forgotUsername(this.usernameRecoveryEmail).subscribe({
      next: (res) => {
        this.handleUsernameRecoverySuccess(res);
      },
      error: (err) => {
        this.handleUsernameRecoveryError(err);
      },
    });
  }

  private handleUsernameRecoverySuccess(res: any): void {
    this.isLoading = false;

    if (res.status === 'success') {
      this.usernameRecoveryEmailSent = true;
      this.successMessage =
        res.message || 'Your username has been sent to your email';
    } else {
      this.errorMessage =
        res.message || 'Failed to send username recovery email';
    }
  }

  private handleUsernameRecoveryError(err: any): void {
    this.isLoading = false;
    console.error('Username recovery error:', err);
    this.errorMessage =
      err?.error?.message ||
      'Failed to send username recovery email. Please try again.';
  }


  resetUsernameRecoveryForm(): void {
    this.usernameRecoveryEmail = '';
    this.usernameRecoveryEmailSent = false;
    this.clearMessages();
    this.clearErrors();
  }
  tryAgainUsername(): void {
    this.usernameRecoveryEmailSent = false;
    this.usernameRecoveryEmail = '';
    this.clearMessages();
  }

  private clearMessages(): void {
    this.errorMessage = '';
    this.successMessage = '';
  }

  private clearErrors(): void {
    this.usernameError = '';
    this.passwordError = '';
    this.resetEmailError = '';
    this.usernameRecoveryEmailError = '';
  }
}
