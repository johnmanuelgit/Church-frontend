// src/app/services/tax.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface TaxRate {
  _id?: string;
  year: number;
  adultTax: number;
  childTax: number;
  adultAgeThreshold: number;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface TaxPayment {
  _id: string;
  name: string;
  age: number;
  dateOfBirth: Date;
  taxAmount: number;
  isPaid: boolean;
  paidAmount: number;
  paidDate?: Date;
  familyId: string;
  isHeadOfFamily: boolean;
  status: string;
  year?: number; // Added for all years view
}

export interface TaxSummary {
  year: number;
  total: number;
  totalMembers: number;
  paidMembers: number;
  unpaidMembers: number;
  collectionRate: number;
  totalTaxAmount: number;
  paidTaxAmount: number;
  unpaidTaxAmount: number;
}

export interface FamilyHead {
  _id: string;
  familyId: string;
  name: string;
}

@Injectable({
  providedIn: 'root'
})
export class TaxService {
  private apiUrl = 'https://stthomoschurch-backend.onrender.com/api/tax';
  private taxData: TaxSummary[] = [];
  
  constructor(private http: HttpClient) {}

  // Tax Rate Management
  getTaxRates(year: number): Observable<TaxRate> {
    return this.http.get<TaxRate>(`${this.apiUrl}/rates/${year}`);
  }

  updateTaxRates(year: number, rates: Partial<TaxRate>): Observable<TaxRate> {
    return this.http.put<TaxRate>(`${this.apiUrl}/rates/${year}`, rates);
  }

  // Tax Payment Management
  generateTaxPayments(year: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/generate/${year}`, {});
  }

  getTaxSummary(year: number, familyId?: string): Observable<TaxSummary> {
    const params: any = { year };
    if (familyId) {
      params.familyId = familyId;
    }
    return this.http.get<TaxSummary>(`${this.apiUrl}/summary`, { params });
  }

  // New method for all years summary
  getAllYearsSummary(familyId?: string): Observable<TaxSummary[]> {
    const params: any = {};
    if (familyId) {
      params.familyId = familyId;
    }
    return this.http.get<TaxSummary[]>(`${this.apiUrl}/summary/all-years`, { params });
  }

  getMemberTaxDetails(year: number, familyId?: string): Observable<TaxPayment[]> {
    const params: any = { year };
    if (familyId) {
      params.familyId = familyId;
    }
    return this.http.get<TaxPayment[]>(`${this.apiUrl}/details`, { params });
  }

  // New method for all years member details
  getAllYearsMemberDetails(familyId?: string): Observable<TaxPayment[]> {
    const params: any = {};
    if (familyId) {
      params.familyId = familyId;
    }
    return this.http.get<TaxPayment[]>(`${this.apiUrl}/details/all-years`, { params });
  }

  updatePaymentStatus(paymentId: string, paymentData: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/payment/${paymentId}`, paymentData);
  }

  // Utility Methods
  getFamilyHeads(): Observable<FamilyHead[]> {
    return this.http.get<FamilyHead[]>(`${this.apiUrl}/family-heads`);
  }

  getAvailableYears(): Observable<number[]> {
    return this.http.get<number[]>(`${this.apiUrl}/years`);
  }

  exportTaxReport(year: number, familyId?: string): Observable<any> {
    const params: any = { year };
    if (familyId) {
      params.familyId = familyId;
    }
    return this.http.get(`${this.apiUrl}/export`, { params });
  }

  // New method for all years export
  exportAllYearsReport(familyId?: string): Observable<any> {
    const params: any = {};
    if (familyId) {
      params.familyId = familyId;
    }
    return this.http.get(`${this.apiUrl}/export/all-years`, { params });
  }

  // Load all tax data from the backend
  loadTaxData(): Observable<TaxSummary[]> {
    return this.http.get<TaxSummary[]>(`${this.apiUrl}/tax/summary`);
  }

  // Store the loaded tax data in memory
  setTaxData(data: TaxSummary[]): void {
    this.taxData = data;
  }

  // Get tax data for a specific year
  getTaxDataForYear(year: string): TaxSummary | null {
    const yearNumber = parseInt(year, 10);
    return this.taxData.find(t => t.year === yearNumber) || null;
  }

  // Get all tax data
  getAllTaxData(): TaxSummary[] {
    return this.taxData;
  }

  getAllMembers(familyId?: string): Observable<TaxPayment[]> {
  const params: any = {};
  if (familyId) {
    params.familyId = familyId;
  }
  return this.http.get<TaxPayment[]>(`${this.apiUrl}/members`, { params });
}
getMemberPaymentForYear(memberId: string, year: number): Observable<TaxPayment[]> {
  return this.http.get<TaxPayment[]>(`${this.apiUrl}/payment/${memberId}?year=${year}`);
}

  
}