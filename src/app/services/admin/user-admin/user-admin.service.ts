import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

export interface User {
  _id?: string;
  username: string;
  email: string;
  password?: string;
  role: 'admin';
  isActive: boolean;
  moduleAccess: {
    lcf: boolean;
    incomeExpense: boolean;
    members: boolean;
    user: boolean;
    xmas: boolean;
  };
}

@Injectable({
  providedIn: 'root',
})
export class UserAdminService {
  private apiUrl = 'api/admin/superadmin';

  constructor(private http: HttpClient) {}

  createAdminBySuperAdmin(user: any) {
    return this.http.post(`${this.apiUrl}/create-admin`, user);
  }

  getAllAdmins() {
    return this.http.get<User[]>(`${this.apiUrl}/admins`);
  }

  editAdmin(id: string, user: User) {
    return this.http.put(`${this.apiUrl}/edit-admin/${id}`, user);
  }

  deleteAdmin(id: string) {
    return this.http.delete(`${this.apiUrl}/delete-admin/${id}`);
  }
}
