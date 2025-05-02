import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class TaxSummaryService {
  private taxData: { [year: string]: number } = {};

  constructor(private http: HttpClient) {}

  loadTaxData(): Observable<any> {
    return this.http.get<any>('https://stthomoschurch-backend.onrender.com/api/tax/summary');
  }
  
  setTaxData(data: any[]) {
    this.taxData = {};
    data.forEach(entry => {
      this.taxData[entry.year] = entry.total;
    });
  }
  
  getTaxForYear(year: string): number {
    return this.taxData[year] || 0;
  }
  
  
}
