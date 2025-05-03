import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TaxSummaryService } from '../../services/admin/tax-summary/tax-summary.service';
import { MembersService } from '../../services/admin/members/members.service';

export interface Member {
  _id: string; // Add this line
  id: number;
  name: string;
  dob: string;
  nativeaddress: string;
  currentaddress: string;
  mobilenum: string;
  baptism: string;
  solidifying: string;
  familyHead: string;
  familyHeadName?: string;  // Changed from familyHeadId to familyHead to match backend
  tax?: { [year: string]: boolean };
  taxPaid: boolean;
}

@Component({
  selector: 'app-lcf-tax',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './lcf-tax.component.html',
  styleUrls: ['./lcf-tax.component.css']
})
export class LcfTaxComponent implements OnInit {
  familyHeads: any[] = [];
  familyMembers: any[] = [];
  members: any[] = [];
  selectedHead: string = '';
  selectedYear: string = '';
  availableYears: string[] = [];
  errorMessage: string = '';

  constructor(private taxService: TaxSummaryService,  private membersService: MembersService) {}

  ngOnInit(): void {
    this.fetchFamilyHeads();
    this.fetchAllMembers();
    this.setAvailableYears();
  }

  setAvailableYears(): void {
    const currentYear = new Date().getFullYear();
    this.availableYears = Array.from({ length: 10 }, (_, i) => (currentYear - i).toString());
  }

  fetchFamilyHeads(): void {
    this.membersService.getFamilyHeads().subscribe({
      next: (data: any[]) => {
        this.familyHeads = data;
      },
      error: (err) => {
        this.errorMessage = 'Failed to fetch family heads';
      }
    });
  }
  fetchAllMembers(): void {
    this.membersService.getAllMembers().subscribe({
      next: (data: any[]) => {
        this.members = data;
      },
      error: () => {
        this.errorMessage = 'Failed to fetch members';
      }
    });
  }
  

  selectHead(): void {
    if (!this.selectedHead) {
      this.familyMembers = [];
      return;
    }
  
    this.membersService.getFamilyMembersByHead(this.selectedHead).subscribe({
      next: (data: any[]) => {
        this.familyMembers = data;
      },
      error: () => {
        this.errorMessage = 'Failed to fetch family members';
      }
    });
  }
  

  onYearChange(): void {
    // You might want to refresh data here if necessary
  }

  getAge(dob: string): number {
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const hasBirthdayPassed = (
      today.getMonth() > birthDate.getMonth() ||
      (today.getMonth() === birthDate.getMonth() && today.getDate() >= birthDate.getDate())
    );
    return hasBirthdayPassed ? age : age - 1;
  }

  calculateTax(dob: string): number {
    const age = this.getAge(dob);
    if (age < 5) return 0;
    if (age < 18) return 50;
    if (age < 60) return 100;
    return 70;
  }

  markAsPaid(member: any): void {
    if (!this.selectedYear || !member) return;

    this.taxService.markTaxPaid(member.id, this.selectedYear).subscribe({
      next: () => {
        if (this.selectedHead) this.selectHead();
        else this.fetchAllMembers();
      },
      error: () => {
        this.errorMessage = 'Failed to mark as paid';
      }
    });
  }

  editPayment(member: any): void {
    if (!this.selectedYear || !member) return;

    this.taxService.markTaxUnpaid(member.id, this.selectedYear).subscribe({
      next: () => {
        if (this.selectedHead) this.selectHead();
        else this.fetchAllMembers();
      },
      error: () => {
        this.errorMessage = 'Failed to update payment';
      }
    });
  }

  getPaidCount(): number {
    return this.familyMembers.filter(m => m.tax?.[this.selectedYear]).length;
  }

  getTotalTax(): number {
    return this.familyMembers.reduce((sum, m) => sum + this.calculateTax(m.dob), 0);
  }

  getSummary() {
    const all = this.selectedHead ? this.familyMembers : this.members;
    let paidCount = 0;
    let unpaidCount = 0;
    let totalTax = 0;
    let paidAmount = 0;
    let unpaidAmount = 0;

    for (let m of all) {
      const tax = this.calculateTax(m.dob);
      totalTax += tax;
      if (this.selectedYear === 'all') {
        const yearsPaid = Object.keys(m.tax || {});
        if (yearsPaid.length > 0) paidCount++;
        else unpaidCount++;
      } else {
        if (m.tax?.[this.selectedYear]) {
          paidCount++;
          paidAmount += tax;
        } else {
          unpaidCount++;
          unpaidAmount += tax;
        }
      }
    }

    return {
      totalMembers: all.length,
      paidCount,
      unpaidCount,
      totalTax,
      paidAmount,
      unpaidAmount,
      paidPlusUnpaidAmount: paidAmount + unpaidAmount,
    };
  }
}