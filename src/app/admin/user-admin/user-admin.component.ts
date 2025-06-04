import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/admin/auth/auth.service';

interface FormErrors {
  email?: string;
  password?: string;
  [key: string]: string | undefined;
}

@Component({
  selector: 'app-user-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './user-admin.component.html',
  styleUrls: ['./user-admin.component.css']
})
export class UserAdminComponent {
  email: string = '';
  password: string = '';
  errorMessage: string = '';
  isLoading: boolean = false;
  errors: FormErrors = {};
  rememberMe: boolean = false;

  constructor(
    private authService: AuthService, 
    private router: Router
  ) {}

  /**
   * Validates the form fields
   * @returns boolean - true if form is valid, false otherwise
   */
  validate(): boolean {
    this.errors = {};
    let isValid = true;

    // Email validation
    if (!this.email.trim()) {
      this.errors['email'] = 'Email is required';
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email)) {
      this.errors['email'] = 'Please enter a valid email address';
      isValid = false;
    }

    // Password validation
    if (!this.password.trim()) {
      this.errors['password'] = 'Password is required';
      isValid = false;
    } else if (this.password.length < 6) {
      this.errors['password'] = 'Password must be at least 6 characters';
      isValid = false;
    }

    return isValid;
  }

  /**
   * Handles the login form submission
   */
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
      }
    });
  }

  /**
   * Handles successful login response
   * @param res - API response
   */
  private handleLoginResponse(res: any): void {
    if (res?.status === 'success') {
      if (this.rememberMe) {
        // You might want to implement remember me functionality here
        // For example, storing tokens in localStorage instead of sessionStorage
      }
      this.router.navigate(['/admindash']);
    } else {
      this.errorMessage = res?.message || 'Invalid credentials';
    }
    this.isLoading = false;
  }

  /**
   * Handles login error
   * @param err - Error object
   */
  private handleLoginError(err: any): void {
    this.errorMessage = err?.error?.message || 
                       err?.message || 
                       'Login failed. Please try again later.';
    this.isLoading = false;
    console.error('Login error:', err);
  }


  resetForm(): void {
    this.email = '';
    this.password = '';
    this.errorMessage = '';
    this.errors = {};
  }
}