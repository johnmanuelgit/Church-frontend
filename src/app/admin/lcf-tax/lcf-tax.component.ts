import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';

export interface Member {
  id: number; // Changed from string to number to match backend
  name: string;
  dob: string;
  nativeaddress: string;
  currentaddress: string;
  mobilenum: string;
  baptism: string;
  solidifying: string;
  familyHead: string; // Changed from familyHeadId to familyHead to match backend
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
  
  selectedHead: string = '';
  familyMembers: Member[] = [];
  familyHeads: { id: string, name: string }[] = [];
  
  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadMembers();
  }

  loadMembers(): void {
    this.http.get<Member[]>('https://stthomoschurch-backend.onrender.com/members').subscribe({
      next: (data) => {
        console.log('Data received:', data); // Debug log
        
        // Ensure taxPaid is always present
        this.members = data.map(m => ({
          ...m,
          taxPaid: m.taxPaid ?? false
        }));
        
        this.getFamilyHeads();
      },
      error: (err) => {
        console.error('Failed to load members:', err);
      }
    });
  }

  selectHead() {
    console.log('Selected head:', this.selectedHead); // Debug log
    
    if (!this.selectedHead) {
      this.familyMembers = [];
      return;
    }
    
    // Filter members where familyHead matches selectedHead
    this.familyMembers = this.members.filter(m => m.familyHead === this.selectedHead);
    console.log('Family members:', this.familyMembers); // Debug log
    
    // Also add the head themselves to the list if they exist
    const head = this.members.find(m => m.id.toString() === this.selectedHead);
    if (head && !this.familyMembers.some(m => m.id === head.id)) {
      this.familyMembers.push(head);
    }
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
    return this.familyMembers.reduce((sum, member) => sum + this.calculateTax(member.dob), 0);
  }

  // Helper method for template - fixes the filter/length error
  getPaidCount(): number {
    return this.familyMembers.filter(member => member.taxPaid).length;
  }

  getFamilyHeads() {
    // Get unique heads first - these are members who are family heads for others
    const familyHeadsSet = new Set<string>();
    
    this.members.forEach(member => {
      if (member.familyHead && member.familyHead !== member.id.toString()) {
        familyHeadsSet.add(member.familyHead);
      }
    });
    
    // Also include self-heads (members who are their own family head)
    this.members.forEach(member => {
      if (!member.familyHead) {
        familyHeadsSet.add(member.id.toString());
      }
    });
    
    // Create the family heads array
    this.familyHeads = Array.from(familyHeadsSet).map(headId => {
      const head = this.members.find(m => m.id.toString() === headId);
      return { 
        id: headId, 
        name: head ? head.name : `Unknown (ID: ${headId})` 
      };
    });
    
    console.log('Family headss:', this.familyHeads); // Debug log// Debug log
  }

  markAsPaid(member: Member) {
    member.taxPaid = true;

    this.http.put(`https://stthomoschurch-backend.onrender.com/${member.id}`, member).subscribe({
      next: () => {
        console.log(`Member ${member.name} marked as paid`);
        // Update the local members array
        const index = this.members.findIndex(m => m.id === member.id);
        if (index !== -1) {
          this.members[index].taxPaid = true;
        }
      },
      error: (err) => {
        console.error('Failed to update member tax status:', err);
        console.error('Failed to update');
        // Revert the local change if the server update failed
        member.taxPaid = false;
      }
    });
  }
}