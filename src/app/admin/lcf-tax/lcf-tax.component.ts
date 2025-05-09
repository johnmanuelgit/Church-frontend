import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TaxSummaryService, TaxRecord, TaxSummary } from '../../services/admin/tax-summary/tax-summary.service';
import { HttpClient } from '@angular/common/http';

export interface Member {
  _id: string;
  id: number;
  name: string;
  dob: string;
  dateOfBirth?: string; // Support both field names
  nativeaddress: string;
  currentaddress: string;
  mobilenum: string;
  baptism: string;
  solidifying: string;
  familyHead: string;
  tax?: { [year: string]: { taxPaid: boolean, amount: number } };
}

@Component({
  selector: 'app-lcf-tax',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './lcf-tax.component.html',
  styleUrls: ['./lcf-tax.component.css']
})
export class LcfTaxComponent implements OnInit {
  members: Member[] = [];
  selectedYear: string = new Date().getFullYear().toString();
  availableYears: string[] = [];
  
  selectedHead: string = '';
  familyMembers: Member[] = [];
  familyHeads: { id: string, name: string }[] = [];
  taxRecords: TaxRecord[] = [];
  errorMessage: string = '';
  
  // New properties for tax amount editing
  editingTaxAmount: { memberId: string, year: string } | null = null;
  customTaxAmount: number = 0;
  
  constructor(private http: HttpClient, private taxService: TaxSummaryService) {}

  ngOnInit(): void {
    this.loadMembers();
    this.generateYears();
    this.loadTaxSummary();
  }

  loadMembers(): void {
    this.http.get<Member[]>('https://stthomoschurch-backend.onrender.com/api/members').subscribe({
      next: (data) => {
        console.log('Data received:', data);
  
        this.members = data.map(m => ({
          ...m,
          tax: {}
        }));
  
        this.loadTaxRecords();
      },
      error: (err) => {
        console.error('Failed to load members:', err);
        this.errorMessage = 'Failed to load members. Please try again later.';
      }
    });
  }
  
  loadTaxRecords(): void {
    this.taxService.getAllTaxRecords().subscribe({
      next: (records) => {
        this.taxRecords = records;
        this.mergeTaxIntoMembers();
        this.getFamilyHeads();
        this.selectHead();
      },
      error: (err) => {
        console.error('Failed to load tax records:', err);
      }
    });
  }
  
  loadTaxSummary(): void {
    this.taxService.getTaxSummary().subscribe({
      next: (summary) => {
        this.taxService.setTaxData(summary);
      },
      error: (err) => {
        console.error('Failed to load tax summary:', err);
      }
    });
  }
  
  mergeTaxIntoMembers(): void {
    // Reset tax info
    for (const member of this.members) {
      member.tax = {};
    }
  
    // Merge tax records data
    for (const rec of this.taxRecords) {
      const member = this.members.find(m => m._id === rec.memberId);
      if (member) {
        if (!member.tax) member.tax = {};
        member.tax[rec.year.toString()] = {
          taxPaid: rec.taxPaid,
          amount: rec.amount
        };
      }
    }
  }

  selectHead() {
    console.log('Selected head:', this.selectedHead);
    
    if (!this.selectedHead) {
      this.familyMembers = [];
      return;
    }
  
    // Filter to find family members
    this.familyMembers = this.members.filter(
      m => m.familyHead?.toString() === this.selectedHead.toString()
    );
  
    // Add the head if not already included
    const head = this.members.find(
      m => m.id.toString() === this.selectedHead.toString()
    );
  
    if (head && !this.familyMembers.some(m => m.id === head.id)) {
      this.familyMembers.push(head);
    }
  
    console.log('Family members:', this.familyMembers);
  }
  
  calculateTax(dob: string): number {
    const age = this.getAge(dob);
    return age < 18 ? 500 : 1000;
  }

  getAge(dob: string): number {
    const birthDate = new Date(dob);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    return m < 0 || (m === 0 && today.getDate() < birthDate.getDate()) ? age - 1 : age;
  }

  // Get tax amount - use custom amount if available, otherwise calculate default
  getTaxAmount(member: Member, year: string): number {
    return member.tax?.[year]?.amount || this.calculateTax(member.dob);
  }

  // Start editing tax amount
  editTaxAmount(member: Member): void {
    this.editingTaxAmount = {
      memberId: member._id,
      year: this.selectedYear
    };
    this.customTaxAmount = this.getTaxAmount(member, this.selectedYear);
  }

  // Save edited tax amount
  saveTaxAmount(member: Member): void {
    if (!this.customTaxAmount || this.customTaxAmount < 0) {
      this.errorMessage = 'Please enter a valid tax amount';
      return;
    }

    const taxPaid = member.tax?.[this.selectedYear]?.taxPaid || false;
    
    this.taxService.updateTaxAmount(member._id, Number(this.selectedYear), this.customTaxAmount, taxPaid).subscribe({
      next: (response) => {
        // Update local data
        if (!member.tax) member.tax = {};
        member.tax[this.selectedYear] = {
          taxPaid: taxPaid,
          amount: this.customTaxAmount
        };
        
        this.editingTaxAmount = null;
        this.loadTaxSummary(); // Refresh summary data
      },
      error: (err) => {
        console.error('Error updating tax amount:', err);
        this.errorMessage = 'Failed to update tax amount';
      }
    });
  }

  // Cancel tax amount editing
  cancelEditTaxAmount(): void {
    this.editingTaxAmount = null;
  }

  // Helper method for template - get total tax for family
  getTotalTax(): number {
    if (this.selectedYear === 'all') {
      return this.familyMembers.reduce((sum, member) => {
        let yearTotal = 0;
        Object.entries(member.tax || {}).forEach(([year, taxInfo]) => {
          if (taxInfo.taxPaid) {
            yearTotal += taxInfo.amount;
          }
        });
        return sum + yearTotal;
      }, 0);
    }
  
    return this.familyMembers.reduce((sum, member) => 
      sum + this.getTaxAmount(member, this.selectedYear), 0);
  }
  
  // Helper method for template - get paid count
  getPaidCount(): number {
    if (this.selectedYear === 'all') {
      return this.familyMembers.filter(member =>
        Object.values(member.tax || {}).some(taxInfo => taxInfo.taxPaid)
      ).length;
    }
  
    return this.familyMembers.filter(member => 
      member.tax?.[this.selectedYear]?.taxPaid).length;
  }
  
  getFamilyHeads() {
    const familyHeadsSet = new Set<string>();
  
    this.members.forEach(member => {
      if (member.familyHead && member.familyHead !== member.id.toString()) {
        familyHeadsSet.add(member.familyHead);
      }
    });
  
    this.members.forEach(member => {
      if (!member.familyHead) {
        familyHeadsSet.add(member.id.toString());
      }
    });
  
    const memberMap = new Map(this.members.map(m => [m.id.toString(), m]));
    this.familyHeads = Array.from(familyHeadsSet).map(headId => {
      const head = memberMap.get(headId);
      return {
        id: headId,
        name: head ? head.name : `Unknown (ID: ${headId})`
      };
    });
  
    console.log('Family heads:', this.familyHeads);
  }
  
  markAsPaid(member: Member) {
    const amount = this.getTaxAmount(member, this.selectedYear);
    
    this.taxService.markTaxPaid(member._id, Number(this.selectedYear), amount).subscribe({
      next: (response) => {
        if (!member.tax) member.tax = {};
        member.tax[this.selectedYear] = {
          taxPaid: true,
          amount: amount
        };
        this.loadTaxSummary();
      },
      error: (err) => {
        console.error('Error marking as paid:', err);
        this.errorMessage = 'Failed to mark as paid';
      }
    });
  }
  
  editPayment(member: Member) {
    this.taxService.markTaxUnpaid(member._id, Number(this.selectedYear)).subscribe({
      next: (response) => {
        if (member.tax && member.tax[this.selectedYear]) {
          member.tax[this.selectedYear].taxPaid = false;
        }
        this.loadTaxSummary();
      },
      error: (err) => {
        console.error('Error marking as unpaid:', err);
        this.errorMessage = 'Failed to mark as unpaid';  
      }
    });
  }
  
  onYearChange(): void {
    console.log("Year changed to:", this.selectedYear);
    this.selectHead();
  }
  
  generateYears() {
    const currentYear = new Date().getFullYear();
    const startYear = 2020; // or your desired start year
    this.availableYears = [];
  
    for (let y = startYear; y <= currentYear + 1; y++) {
      this.availableYears.push(y.toString());
    }
  }
  
  getSummary() {
    let totalTax = 0;
    let paidCount = 0;
    let unpaidCount = 0;
    let paidAmount = 0;
    let unpaidAmount = 0;
  
    // Use familyMembers if head is selected, otherwise use all members
    const targetMembers = this.selectedHead ? this.familyMembers : this.members;
  
    for (let member of targetMembers) {
      const taxAmount = this.getTaxAmount(member, this.selectedYear);
      totalTax += taxAmount;
  
      if (member.tax?.[this.selectedYear]?.taxPaid) {
        paidCount++;
        paidAmount += taxAmount;
      } else {
        unpaidCount++;
        unpaidAmount += taxAmount;
      }
    }
  
    return {
      totalTax,
      paidCount,
      unpaidCount,
      paidAmount,
      unpaidAmount,
      totalMembers: targetMembers.length,
      paidPlusUnpaidAmount: paidAmount + unpaidAmount
    };
  }
}