import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class TaxSummaryService {
<<<<<<< HEAD
  private apiUrl = 'https://stthomoschurch-backend.onrender.com/api/tax';
=======
>>>>>>> 4b4a4e2 (v1)
  private taxData: { [year: string]: number } = {};

  constructor(private http: HttpClient) {}

  loadTaxData(): Observable<any> {
<<<<<<< HEAD
    return this.http.get<any>(`${this.apiUrl}/summary`);
  }

=======
    return this.http.get<any>('https://stthomoschurch-backend.onrender.com/api/tax/summary');
  }
  
>>>>>>> 4b4a4e2 (v1)
  setTaxData(data: any[]) {
    this.taxData = {};
    data.forEach(entry => {
      this.taxData[entry.year] = entry.total;
    });
  }
<<<<<<< HEAD

  markTaxPaid(memberId: string, year: string): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/mark-paid/${memberId}`, { year });
  }

  markTaxUnpaid(memberId: string, year: string): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/mark-unpaid`, { memberId, year });
  }

  getTaxForYear(year: string): number {
    return this.taxData[year] || 0;
  }
=======
  
  getTaxForYear(year: string): number {
    return this.taxData[year] || 0;
  }
  
  
>>>>>>> 4b4a4e2 (v1)
}
