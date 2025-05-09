import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';

export interface TaxRecord {
  _id: string;
  memberId: string;
  year: number;
  taxPaid: boolean;
  amount: number;
  lastUpdated: Date;
}

export interface TaxSummary {
  year: number;
  total: number;
  paid: number;
  unpaid: number;
  count: number;
  paidCount: number;
}

@Injectable({
  providedIn: 'root'
})
export class TaxSummaryService {
  private apiUrl = 'https://stthomoschurch-backend.onrender.com/api/tax';
  private taxData: { [year: string]: TaxSummary } = {};
  private taxDataSubject = new BehaviorSubject<{ [year: string]: TaxSummary }>({});
  
  taxData$ = this.taxDataSubject.asObservable();

  constructor(private http: HttpClient) {
    // Initialize by loading tax summary data
    this.getTaxSummary().subscribe(data => this.setTaxData(data));
  }

  loadTaxData(): Observable<TaxSummary[]> {
    return this.http.get<TaxSummary[]>(`${this.apiUrl}/summary`);
  }
    
  setTaxData(data: TaxSummary[]) {
    this.taxData = {};
    data.forEach(entry => {
      this.taxData[entry.year.toString()] = entry;
    });
    this.taxDataSubject.next({...this.taxData});
  }

  markTaxPaid(memberId: string, year: number, amount?: number): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/paid`, { memberId, year, amount })
      .pipe(
        tap(() => this.refreshTaxSummary())
      );
  }

  markTaxUnpaid(memberId: string, year: number): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/unpaid`, { memberId, year })
      .pipe(
        tap(() => this.refreshTaxSummary())
      );
  }

  updateTaxAmount(memberId: string, year: number, amount: number, taxPaid?: boolean): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/update-amount`, { memberId, year, amount, taxPaid })
      .pipe(
        tap(() => this.refreshTaxSummary())
      );
  }

  getMemberTaxRecords(memberId: string): Observable<TaxRecord[]> {
    return this.http.get<TaxRecord[]>(`${this.apiUrl}/member/${memberId}`);
  }

  getAllTaxRecords(): Observable<TaxRecord[]> {
    return this.http.get<TaxRecord[]>(`${this.apiUrl}/all`);
  }

  getTaxSummary(): Observable<TaxSummary[]> {
    return this.http.get<TaxSummary[]>(`${this.apiUrl}/summary`);
  }

  getTaxDataForYear(year: string): TaxSummary | null {
    return this.taxData[year] || null;
  }

  getAllYearsSummary(): { [year: string]: TaxSummary } {
    return {...this.taxData};
  }
  
  // Helper method to refresh tax summary data after changes
  private refreshTaxSummary(): void {
    this.getTaxSummary().subscribe(data => this.setTaxData(data));
  }
}