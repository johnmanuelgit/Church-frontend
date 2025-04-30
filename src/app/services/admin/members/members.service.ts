import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class MembersService {

  private baseUrl = 'http://localhost:3000/members';

  constructor(private http: HttpClient) {}

  getMembers() {
    return this.http.get(this.baseUrl);
  }

  addMember(member: any) {
    return this.http.post(this.baseUrl, member);
  }

  updateMember(id: number, member: any) {
    return this.http.put(`${this.baseUrl}/${id}`, member);
  }

  deleteMember(id: number) {
    return this.http.delete(`${this.baseUrl}/${id}`);
  }


}
