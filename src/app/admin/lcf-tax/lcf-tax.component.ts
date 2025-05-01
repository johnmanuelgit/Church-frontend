import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';

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
  familyHead: string; // Changed from familyHeadId to familyHead to match backend
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
  members: Member[] = [];
  selectedYear: string = new Date().getFullYear().toString();
availableYears: string[] = [];

  
  selectedHead: string = '';
  familyMembers: Member[] = [];
  familyHeads: { id: string, name: string }[] = [];
  taxRecords: { memberId: string; year: number; taxPaid: boolean }[] = [];
  errorMessage: string = '';

  
  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadMembers();
    this.generateYears();
  }

  loadMembers(): void {
    this.http.get<Member[]>('http://localhost:3000/api/members').subscribe({
      next: (data) => {
        console.log('Data received:', data);
  
        this.members = data.map(m => ({
          ...m,
          tax: m.tax ?? {}
        }));
  
        this.loadTaxRecords(); // ✅ Called only once after mapping
      },
      error: (err) => {
        console.error('Failed to load members:', err);
        this.errorMessage = 'Failed to load members. Please try again later.';
      }
    });
  }
  loadTaxRecords(): void {
    this.http.get<any[]>('http://localhost:3000/api/tax/all').subscribe({
      next: (records) => {
        this.taxRecords = records;
        this.mergeTaxIntoMembers();
        this.getFamilyHeads();
        this.selectHead(); // 👈 Force update of familyMembers list
      },
      error: (err) => {
        console.error('Failed to load tax records:', err);
      }
    });
  }
  
  
  mergeTaxIntoMembers(): void {
    for (const member of this.members) {
      member.tax = {};
    }
  
    for (const rec of this.taxRecords) {
      const member = this.members.find(m => m._id === rec.memberId);

      if (member) {
        member.tax![rec.year.toString()] = rec.taxPaid;
      }
    }
  }

  selectHead() {
    console.log('Selected head:', this.selectedHead);
    
    if (!this.selectedHead) {
      this.familyMembers = [];
      return;
    }
  
    // Coerce both to strings to avoid mismatches
    this.familyMembers = this.members.filter(
      m => m.familyHead?.toString() === this.selectedHead.toString()
    );
  
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

  // Helper method for template - fixes the reduce error
  getTotalTax(): number {
    if (this.selectedYear === 'all') {
      return this.familyMembers.reduce((sum, member) => {
        const yearsPaid = Object.entries(member.tax ?? {}).filter(([_, paid]) => paid);
        return sum + (this.calculateTax(member.dob) * yearsPaid.length);
      }, 0);
    }
  
    return this.familyMembers.reduce((sum, member) => sum + this.calculateTax(member.dob), 0);
  }
  

  // Helper method for template - fixes the filter/length error
  getPaidCount(): number {
    if (this.selectedYear === 'all') {
      return this.familyMembers.filter(member =>
        Object.values(member.tax ?? {}).some(paid => paid)
      ).length;
    }
  
    return this.familyMembers.filter(member => member.tax?.[this.selectedYear]).length;
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
    if (!member.tax) member.tax = {};
    member.tax[this.selectedYear] = true;
  
    const payload = {
      memberId: member._id,
      year: Number(this.selectedYear)
    };
  
    this.http.put('http://localhost:3000/api/tax/paid', payload).subscribe({
      next: () => {
        console.log(`Marked as paid for ${this.selectedYear}`);
        this.loadTaxRecords(); // 👈 RELOAD updated data
      },
      error: (err) => {
        console.error('Error marking as paid:', err);
        member.tax![this.selectedYear] = false; // Revert on failure
      }
    });
  }
  
  editPayment(member: Member) {
    if (!member.tax) member.tax = {};
    member.tax[this.selectedYear] = false;
  
    const payload = {
      memberId: member._id, // Consistently use _id
      year: Number(this.selectedYear)
    };
  
    this.http.put('http://localhost:3000/api/tax/unpaid', payload).subscribe({
      next: () => {
        console.log(`Marked as unpaid for ${this.selectedYear}`);
        this.loadTaxRecords(); // 👈 RELOAD updated data
      },
      error: (err) => {
        console.error('Error marking as unpaid:', err);
        member.tax![this.selectedYear] = true; // Revert on failure
      }
    });
  }
  
  
  onYearChange(): void {
    console.log("Year changed to:", this.selectedYear);
    this.selectHead();
    this.getFamilyHeads();
  }
  
  
  
  generateYears() {
    const currentYear = new Date().getFullYear();
    const startYear = 2020; // or your desired start year
    this.availableYears = [];
  
    for (let y = startYear; y <= currentYear + 1; y++) {
      this.availableYears.push(y.toString());
    }
  }
  
  getAllYearsSummary() {
    let total = 0, paid = 0;
  
    this.members.forEach(member => {
      const tax = this.calculateTax(member.dob);
      total += tax;
      if (member.tax?.[this.selectedYear]) paid += tax;
    });
  
    return { total, paid, unpaid: total - paid };
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
      const taxAmount = this.calculateTax(member.dob);
      totalTax += taxAmount;
  
      if (member.tax?.[this.selectedYear]) {
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