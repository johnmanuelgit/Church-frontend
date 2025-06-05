import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';

import { Router } from '@angular/router';
import { AuthService } from '../../services/admin/auth/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-reset-password',
  standalone:true,
  imports:[CommonModule,FormsModule,ReactiveFormsModule],
  templateUrl: './reset-password.component.html',
   styleUrl: './reset-password.component.css'
})
export class ResetPasswordComponent implements OnInit {
  token: string = '';
  resetForm!: FormGroup;
  errorMessage: string = '';
  successMessage: string = '';

  constructor(
    private route: ActivatedRoute,
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    this.token = this.route.snapshot.queryParamMap.get('token') || '';

    if (!this.token) {
      this.errorMessage = 'Invalid or missing reset token';
      return;
    }

    this.resetForm = this.fb.group({
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  onSubmit() {
    if (this.resetForm.invalid) return;

    const newPassword = this.resetForm.value.newPassword;

    this.authService.resetPassword(this.token, newPassword).subscribe({
      next: (res) => {
        this.successMessage = 'Password reset successfully!';
        this.router.navigate(['/login']); // redirect to login after success
      },
      error: (err) => {
        this.errorMessage = err.message || 'Failed to reset password';
      }
    });
  }

  // Add to your component
isSubmitting: boolean = false;
showPassword: boolean = false;

togglePasswordVisibility(): void {
  this.showPassword = !this.showPassword;
  const input = document.getElementById('newPassword') as HTMLInputElement;
  input.type = this.showPassword ? 'text' : 'password';
}
}
