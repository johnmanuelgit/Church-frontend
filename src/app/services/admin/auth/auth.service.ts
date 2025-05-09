// src/app/services/auth.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, catchError, throwError } from 'rxjs';
import { Router } from '@angular/router';

interface LoginResponse {
  status: string;
  message: string;
  token?: string;
  user?: {
    id: string;
    username: string;
    role?: string;
  };
}

interface ForgotPasswordResponse {
  status: string;
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'https://stthomoschurch-backend.onrender.com';
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(this.hasValidToken());
  private userSubject = new BehaviorSubject<any>(this.getCurrentUser());
  private rememberMeKey = 'admin_remember';

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}
  login(username: string, password: string, rememberMe: boolean = false): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/api/admin/login`, { username, password })
  
      .pipe(
        tap(response => {
          if (response.status === 'success') {
            // Store authentication status
            localStorage.setItem('adminAuthenticated', 'true');
            
            // Store user data if available
            if (response.user) {
              if (rememberMe) {
                localStorage.setItem('admin_user', JSON.stringify(response.user));
                localStorage.setItem(this.rememberMeKey, 'true');
              } else {
                sessionStorage.setItem('admin_user', JSON.stringify(response.user));
                localStorage.removeItem(this.rememberMeKey);
              }
              this.userSubject.next(response.user);
            }
            
            // Store token if available
            if (response.token) {
              if (rememberMe) {
                localStorage.setItem('admin_token', response.token);
              } else {
                sessionStorage.setItem('admin_token', response.token);
              }
            }
            
            this.isAuthenticatedSubject.next(true);
          }
        }),
        catchError(error => {
          this.isAuthenticatedSubject.next(false);
          return throwError(() => error);
        })
      );
  }

  forgotPassword(email: string): Observable<ForgotPasswordResponse> {
    return this.http.post<ForgotPasswordResponse>(`${this.apiUrl}/forgot-password`, { email })
      .pipe(
        catchError(error => {
          return throwError(() => error);
        })
      );
  }

  resetPassword(token: string, newPassword: string): Observable<ForgotPasswordResponse> {
    return this.http.post<ForgotPasswordResponse>(`${this.apiUrl}/reset-password`, { 
      token, 
      newPassword 
    }).pipe(
      catchError(error => {
        return throwError(() => error);
      })
    );
  }

  logout(): void {
    // Clear all storage
    localStorage.removeItem('adminAuthenticated');
    localStorage.removeItem('admin_user');
    localStorage.removeItem('admin_token');
    localStorage.removeItem(this.rememberMeKey);
    sessionStorage.removeItem('admin_user');
    sessionStorage.removeItem('admin_token');
    
    // Update subjects
    this.isAuthenticatedSubject.next(false);
    this.userSubject.next(null);
    
    // Redirect to login page
    this.router.navigate(['/admin/login']);
  }

  isAuthenticated(): Observable<boolean> {
    return this.isAuthenticatedSubject.asObservable();
  }

  private hasValidToken(): boolean {
    return (
      sessionStorage.getItem('admin_token') !== null ||
      (localStorage.getItem('adminAuthenticated') === 'true' && localStorage.getItem('admin_token') !== null)
    );
  }
  

  getCurrentUser(): any {
    // Get user info from session or local storage
    const sessionUser = sessionStorage.getItem('admin_user');
    if (sessionUser) {
      return JSON.parse(sessionUser);
    }

    const rememberMe = localStorage.getItem(this.rememberMeKey);
    if (rememberMe === 'true') {
      const localUser = localStorage.getItem('admin_user');
      return localUser ? JSON.parse(localUser) : null;
    }

    return null;
  }

  getUser(): Observable<any> {
    return this.userSubject.asObservable();
  }

  getToken(): string | null {
    // Check session storage first, then check local storage if remember me was used
    const sessionToken = sessionStorage.getItem('admin_token');
    if (sessionToken) {
      return sessionToken;
    }

    const rememberMe = localStorage.getItem(this.rememberMeKey);
    if (rememberMe === 'true') {
      return localStorage.getItem('admin_token');
    }

    return null;
  }

  isAdmin(): boolean {
    const user = this.getCurrentUser();
    return user && (user.role === 'admin' || user.role === 'administrator');
  }
}