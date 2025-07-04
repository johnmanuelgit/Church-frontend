import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

interface Member {
  id: number | null;
  memberNumber: number | null;
  name: string;
  dateOfBirth: Date | null;
  dateOfBaptism: Date | null;
  dateOfConfirmation: Date | null;
  dateOfMarriage: Date | null;
  permanentAddress: string;
  presentAddress: string;
  mobileNumber: string;
  familyId: string | null;
  isHeadOfFamily: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class MembersService {
  private apiUrl = 'api/members';

  constructor(private http: HttpClient) {}

  getMembers(): Observable<Member[]> {
    return this.http.get<Member[]>(this.apiUrl);
  }

  getMemberById(id: number): Observable<Member> {
    return this.http.get<Member>(`${this.apiUrl}/${id}`);
  }

  createMember(member: Member): Observable<Member> {
    return this.http.post<Member>(this.apiUrl, member);
  }

  updateMember(member: Member): Observable<Member> {
    const id = member.id;
    return this.http.put<Member>(`${this.apiUrl}/${id}`, member);
  }

  deleteMember(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  getFamilyMembers(familyId: string): Observable<Member[]> {
    return this.http.get<Member[]>(`${this.apiUrl}/family/${familyId}`);
  }

  getFamilyHeads(): Observable<Member[]> {
    return this.http.get<Member[]>(`${this.apiUrl}/heads`);
  }

  searchByFamilyId(familyId: string): Observable<Member[]> {
    return this.http.get<Member[]>(`${this.apiUrl}/search/${familyId}`);
  }
}
