import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class MembersService {
  // Use direct API URL instead of environment
  private apiUrl = 'http://localhost:3000/api/members';

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

  updateMemberTaxStatus(id: number, taxPaid: boolean): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/unpaidedit/${id}`, { taxPaid });
  }
}