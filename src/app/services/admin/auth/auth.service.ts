// Updated auth.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
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
      xmas:boolean;
    };
  };
}

interface ForgotPasswordResponse {
  status: string;
  message: string;
}

interface ForgotUsernameResponse {
  status: string;
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'api/admin';
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(this.hasValidToken());
  private userSubject = new BehaviorSubject<any>(this.getCurrentUser());
  private rememberMeKey = 'admin_remember';

  constructor(
    private http: HttpClient,
    private router: Router
  ) { }

  login(username: string, password: string, rememberMe: boolean = false): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, { username, password })
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
                user: false ,
                xmas:false
              }
            };

            if (rememberMe) {
              localStorage.setItem('admin_user', JSON.stringify(userData));
              localStorage.setItem(this.rememberMeKey, 'true');
              localStorage.setItem('admin_token', response.token!);
            } else {
              sessionStorage.setItem('admin_user', JSON.stringify(userData));
              sessionStorage.setItem('admin_token', response.token!);
              localStorage.removeItem(this.rememberMeKey);
            }

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

  // Fixed forgotPassword method with better error handling
  forgotPassword(email: string): Observable<ForgotPasswordResponse> {
    console.log('Sending forgot password request for:', email);
    
    return this.http.post<ForgotPasswordResponse>(
      `${this.apiUrl}/forgot-password`, 
      { email }
    ).pipe(
      tap(response => {
        console.log('Forgot password response:', response);
        if (response.status !== 'success') {
          throw new Error(response.message || 'Failed to send reset email');
        }
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('Forgot password error:', error);
        
        let errorMessage = 'Failed to send reset email. Please try again later.';
        
        if (error.error && error.error.message) {
          errorMessage = error.error.message;
        } else if (error.message) {
          errorMessage = error.message;
        }
        
        return throwError(() => new Error(errorMessage));
      })
    );
  }

// In auth.service.ts
forgotUsername(email: string): Observable<ForgotUsernameResponse> {
  console.log('Sending forgot username request for:', email);
  
  return this.http.post<ForgotUsernameResponse>(
    `${this.apiUrl}/forgot-username`, 
    { email }
  ).pipe(
    tap(response => {
      console.log('Forgot username response:', response);
      if (response.status !== 'success') {
        throw new Error(response.message || 'Failed to send username recovery email');
      }
    }),
    catchError((error: HttpErrorResponse) => {
      console.error('Forgot username error:', error);
      
      let errorMessage = 'Failed to send username recovery email. Please try again later.';
      
      if (error.error && error.error.message) {
        errorMessage = error.error.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      return throwError(() => new Error(errorMessage));
    })
  );
}

  resetPassword(token: string, newPassword: string): Observable<ForgotPasswordResponse> {
    console.log('Sending reset password request');
    
    return this.http.post<ForgotPasswordResponse>(`${this.apiUrl}/reset-password`, {
      token,
      newPassword
    }).pipe(
      tap(response => {
        console.log('Reset password response:', response);
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('Reset password error:', error);
        
        let errorMessage = 'Failed to reset password. Please try again.';
        
        if (error.error && error.error.message) {
          errorMessage = error.error.message;
        } else if (error.message) {
          errorMessage = error.message;
        }
        
        return throwError(() => new Error(errorMessage));
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
    
    this.isAuthenticatedSubject.next(false);
    this.userSubject.next(null);
    this.router.navigate(['/']);
  }

  isAuthenticated(): Observable<boolean> {
    return this.isAuthenticatedSubject.asObservable();
  }

  private hasValidToken(): boolean {
    const rememberMe = localStorage.getItem(this.rememberMeKey) === 'true';
    const token = rememberMe 
      ? localStorage.getItem('admin_token')
      : sessionStorage.getItem('admin_token');
      
    return token !== null;
  }

  getCurrentUser(): any {
    const rememberMe = localStorage.getItem(this.rememberMeKey) === 'true';
    const userData = rememberMe
      ? localStorage.getItem('admin_user')
      : sessionStorage.getItem('admin_user');
      
    try {
      return userData ? JSON.parse(userData) : null;
    } catch (e) {
      console.error('Error parsing user data:', e);
      return null;
    }
  }

  getUser(): Observable<any> {
    return this.userSubject.asObservable();
  }

  getToken(): string | null {
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
                user: false ,
                xmas:false
              }
            };

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