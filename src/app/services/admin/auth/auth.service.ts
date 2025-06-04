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
    moduleAccess?: {
      lcf: boolean;
      incomeExpense: boolean;
      members: boolean;
      user: boolean;
    };
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
  private apiUrl = 'https://church-backend-036s.onrender.com/api/admin';
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(this.hasValidToken());
  private userSubject = new BehaviorSubject<any>(this.getCurrentUser());
  private rememberMeKey = 'admin_remember';

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  login(username: string, password: string, rememberMe: boolean = false): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, { username, password })
      .pipe(
        tap(response => {
          if (response.status === 'success' && response.user && response.token) {
            // Store authentication flag
            localStorage.setItem('adminAuthenticated', 'true');

            // Prepare user data
            const userData = {
              id: response.user.id,
              username: response.user.username,
              role: response.user.role,
              moduleAccess: response.user.moduleAccess || { 
                lcf: false, 
                incomeExpense: false, 
                members: false, 
                user: false 
              }
            };

            // Handle remember me functionality
            if (rememberMe) {
              // Store in localStorage for persistent login
              localStorage.setItem('admin_user', JSON.stringify(userData));
              localStorage.setItem('admin_token', response.token!);
              localStorage.setItem(this.rememberMeKey, 'true');
              
              // Clear session storage to avoid conflicts
              sessionStorage.removeItem('admin_user');
              sessionStorage.removeItem('admin_token');
            } else {
              // Store in sessionStorage for session-only login
              sessionStorage.setItem('admin_user', JSON.stringify(userData));
              sessionStorage.setItem('admin_token', response.token!);
              
              // Clear localStorage and remember me flag
              localStorage.removeItem('admin_user');
              localStorage.removeItem('admin_token');
              localStorage.removeItem(this.rememberMeKey);
            }

            // Update subjects
            this.userSubject.next(userData);
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
          console.error('Forgot password error:', error);
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
        console.error('Reset password error:', error);
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
    // Check session storage first
    const sessionToken = sessionStorage.getItem('admin_token');
    if (sessionToken && sessionStorage.getItem('admin_user')) {
      return true;
    }

    // Check localStorage if remember me was enabled
    const rememberMe = localStorage.getItem(this.rememberMeKey);
    if (rememberMe === 'true') {
      const localToken = localStorage.getItem('admin_token');
      const localUser = localStorage.getItem('admin_user');
      return !!(localToken && localUser);
    }

    return false;
  }

  getCurrentUser(): any {
    // Check session storage first (higher priority)
    const sessionUser = sessionStorage.getItem('admin_user');
    if (sessionUser) {
      try {
        return JSON.parse(sessionUser);
      } catch (e) {
        console.error('Error parsing session user:', e);
        sessionStorage.removeItem('admin_user');
      }
    }

    // Check localStorage if remember me was enabled
    const rememberMe = localStorage.getItem(this.rememberMeKey);
    if (rememberMe === 'true') {
      const localUser = localStorage.getItem('admin_user');
      if (localUser) {
        try {
          return JSON.parse(localUser);
        } catch (e) {
          console.error('Error parsing local user:', e);
          localStorage.removeItem('admin_user');
        }
      }
    }

    return null;
  }

  getUser(): Observable<any> {
    return this.userSubject.asObservable();
  }

  getToken(): string | null {
    // Check session storage first (higher priority)
    const sessionToken = sessionStorage.getItem('admin_token');
    if (sessionToken) {
      return sessionToken;
    }

    // Check localStorage if remember me was enabled
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

  // User login method
  userLogin(email: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/user-login`, { email, password })
      .pipe(
        tap(response => {
          if (response.status === 'success' && response.user && response.token) {
            localStorage.setItem('adminAuthenticated', 'true');
            
            const userData = {
              id: response.user.id,
              username: response.user.username,
              role: response.user.role,
              moduleAccess: response.user.moduleAccess || { 
                lcf: false, 
                incomeExpense: false, 
                members: false, 
                user: false 
              }
            };

            // Store in session storage (no remember me for user login)
            sessionStorage.setItem('admin_user', JSON.stringify(userData));
            sessionStorage.setItem('admin_token', response.token!);
            
            this.userSubject.next(userData);
            this.isAuthenticatedSubject.next(true);
          }
        }),
        catchError(error => {
          this.isAuthenticatedSubject.next(false);
          return throwError(() => error);
        })
      );
  }
}