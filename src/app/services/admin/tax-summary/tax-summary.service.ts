import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class TaxSummaryService {
  private apiUrl = 'https://stthomoschurch-backend.onrender.com/api/tax';
  private taxData: { [year: string]: number } = {};

  constructor(private http: HttpClient) {}

  loadTaxData(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/summary`);
  }

  setTaxData(data: any[]) {
    this.taxData = {};
    data.forEach(entry => {
      this.taxData[entry.year] = entry.total;
    });
  }

  markTaxPaid(memberId: string, year: string): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/mark-paid/${memberId}`, { year });
  }

  markTaxUnpaid(memberId: string, year: string): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/mark-unpaid`, { memberId, year });
  }

  getTaxForYear(year: string): number {
    return this.taxData[year] || 0;
  }
}
