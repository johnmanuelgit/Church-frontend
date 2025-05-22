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
  paymentDate: string;
}

export interface TaxSummary {
  year: number;
  total: number;
  paid: number;
  unpaid: number;
  count: number;
  paidCount: number;
}

export interface TaxRateConfig {
  adult: number;
  child: number;
  adultAge: number;
  seniorAge?: number;
  seniorDiscount?: number;
}

@Injectable({
  providedIn: 'root'
})
export class TaxSummaryService {
  private apiUrl = 'https://stthomoschurch-backend.onrender.com/api/tax';
  private taxData: { [year: string]: TaxSummary } = {};
  private taxDataSubject = new BehaviorSubject<{ [year: string]: TaxSummary }>({});
  private taxConfigSubject = new BehaviorSubject<{ [year: string]: TaxRateConfig }>({});
  
  taxData$ = this.taxDataSubject.asObservable();
  taxConfig$ = this.taxConfigSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadTaxData().subscribe();
    this.loadTaxConfigs().subscribe();
  }

  // Load tax data and update local state
  loadTaxData(): Observable<TaxSummary[]> {
    return this.http.get<TaxSummary[]>(`${this.apiUrl}/summary`).pipe(
      tap(data => this.setTaxData(data))
    );
  }

  setTaxData(data: TaxSummary[]): void {
    this.taxData = {};
    data.forEach(entry => {
      this.taxData[entry.year.toString()] = entry;
    });
    this.taxDataSubject.next({...this.taxData});
  }

  // Load tax configurations
  loadTaxConfigs(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/config`).pipe(
      tap(configs => {
        const configMap: { [year: string]: TaxRateConfig } = {};
        configs.forEach((config: any) => {
          configMap[config.year] = config.config;
        });
        this.taxConfigSubject.next(configMap);
      })
    );
  }

  // Mark tax as paid for a member
  markTaxPaid(memberId: string, year: number, amount: number): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/paid`, { memberId, year, amount }).pipe(
      tap(() => this.loadTaxData().subscribe())
    );
  }

  // Mark tax as unpaid for a member
  markTaxUnpaid(memberId: string, year: number): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/unpaid`, { memberId, year }).pipe(
      tap(() => this.loadTaxData().subscribe())
    );
  }

  // Update tax amount for a member
  updateTaxAmount(memberId: string, year: number, amount: number, taxPaid: boolean): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/update-amount`, { 
      memberId, 
      year, 
      amount, 
      taxPaid 
    }).pipe(
      tap(() => this.loadTaxData().subscribe())
    );
  }

  // Update tax configuration
  updateTaxConfig(year: number, config: TaxRateConfig): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/config/${year}`, { config }).pipe(
      tap(() => {
        this.loadTaxConfigs().subscribe();
        this.loadTaxData().subscribe();
      })
    );
  }

  // Get tax configuration for a specific year
  getTaxConfig(year: number): Observable<TaxRateConfig> {
    return this.http.get<TaxRateConfig>(`${this.apiUrl}/config/${year}`);
  }

  // Get all tax configurations
  getAllTaxConfigs(): Observable<{ [year: string]: TaxRateConfig }> {
    return this.taxConfig$;
  }

  // Get tax records for a specific member
  getMemberTaxRecords(memberId: string): Observable<TaxRecord[]> {
    return this.http.get<TaxRecord[]>(`${this.apiUrl}/member/${memberId}`);
  }

  // Get all tax records
  getAllTaxRecords(): Observable<TaxRecord[]> {
    return this.http.get<TaxRecord[]>(`${this.apiUrl}/all`);
  }

  // Get tax summary data
  getTaxSummary(): Observable<TaxSummary[]> {
    return this.http.get<TaxSummary[]>(`${this.apiUrl}/summary`);
  }

  // Get tax data for a specific year
  getTaxDataForYear(year: string): TaxSummary | null {
    return this.taxData[year] || null;
  }

  // Get summary for all years
  getAllYearsSummary(): { [year: string]: TaxSummary } {
    return {...this.taxData};
  }
}