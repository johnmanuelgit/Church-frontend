import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class MembersService {
  // Use direct API URL instead of environment
  private apiUrl = 'https://stthomoschurch-backend.onrender.com/api/members';

  constructor(private http: HttpClient) { }

  getMembers(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }

  addMember(member: any): Observable<any> {
    // Ensure year is not undefined before sending to server
    if (!member.year) {
      member.year = new Date().getFullYear().toString();
    }
    return this.http.post<any>(this.apiUrl, member);
  }

  updateMember(id: number, member: any): Observable<any> {
    // Ensure year is not undefined before sending to server
    if (!member.year) {
      member.year = new Date().getFullYear().toString();
    }
    return this.http.put<any>(`${this.apiUrl}/${id}`, member);
  }

  deleteMember(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }
<<<<<<< HEAD
  
=======
>>>>>>> 4b4a4e2 (v1)

  updateMemberTaxStatus(id: number, taxPaid: boolean): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/unpaidedit/${id}`, { taxPaid });
  }
<<<<<<< HEAD
  getAllMembers(): Observable<any[]> {
    return this.http.get<any[]>('https://stthomoschurch-backend.onrender.com/api/members');
  }
  getFamilyHeads(): Observable<any[]> {
    return this.http.get<any[]>('https://stthomoschurch-backend.onrender.com/api/members/family-heads');
  }
  
  getFamilyMembersByHead(headId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/family-members/${headId}`);
  }
  
=======
>>>>>>> 4b4a4e2 (v1)
}