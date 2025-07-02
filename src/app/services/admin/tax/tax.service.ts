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
  year?: number;
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
  providedIn: 'root',
})
export class TaxService {
  private apiUrl = 'api/tax';
  private taxData: TaxSummary[] = [];

  constructor(private http: HttpClient) {}

  getTaxRates(year: number): Observable<TaxRate> {
    return this.http.get<TaxRate>(`${this.apiUrl}/rates/${year}`);
  }

  updateTaxRates(year: number, rates: Partial<TaxRate>): Observable<TaxRate> {
    return this.http.put<TaxRate>(`${this.apiUrl}/rates/${year}`, rates);
  }

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

  getAllYearsSummary(familyId?: string): Observable<TaxSummary[]> {
    const params: any = {};
    if (familyId) {
      params.familyId = familyId;
    }
    return this.http.get<TaxSummary[]>(`${this.apiUrl}/summary/all-years`, {
      params,
    });
  }

  getMemberTaxDetails(
    year: number,
    familyId?: string
  ): Observable<TaxPayment[]> {
    const params: any = { year };
    if (familyId) {
      params.familyId = familyId;
    }
    return this.http.get<TaxPayment[]>(`${this.apiUrl}/details`, { params });
  }

  getAllYearsMemberDetails(familyId?: string): Observable<TaxPayment[]> {
    const params: any = {};
    if (familyId) {
      params.familyId = familyId;
    }
    return this.http.get<TaxPayment[]>(`${this.apiUrl}/details/all-years`, {
      params,
    });
  }

  updatePaymentStatus(paymentId: string, paymentData: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/payment/${paymentId}`, paymentData);
  }

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

  exportAllYearsReport(familyId?: string): Observable<any> {
    const params: any = {};
    if (familyId) {
      params.familyId = familyId;
    }
    return this.http.get(`${this.apiUrl}/export/all-years`, { params });
  }

  setTaxData(data: TaxSummary[]): void {
    this.taxData = data;
  }

  getTaxDataForYear(year: string): TaxSummary | null {
    const yearNumber = parseInt(year, 10);
    return this.taxData.find((t) => t.year === yearNumber) || null;
  }

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
  getMemberPaymentForYear(
    memberId: string,
    year: number
  ): Observable<TaxPayment[]> {
    return this.http.get<TaxPayment[]>(
      `${this.apiUrl}/payment/${memberId}?year=${year}`
    );
  }
}
