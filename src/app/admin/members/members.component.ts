import { Component, OnInit, ViewChild } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';

import * as XLSX from 'xlsx';
import { MembersService } from '../../services/admin/members/members.service';
import { CommonModule } from '@angular/common';

interface Member {
  id: number | null;
  memberNumber: number | null;
  parentId: string | null;
  name: string;
  dateOfBirth: Date | null;
  dateOfBaptism: Date | null;
  dateOfConfirmation: Date | null;
  dateOfMarriage: Date | null;
  permanentAddress: string;
  presentAddress: string;
  mobileNumber: string;
  formattedParentId?: string;
}

@Component({
  selector: 'app-members',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './members.component.html',
  styleUrls: ['./members.component.css']
})
export class MembersComponent implements OnInit {
  @ViewChild('memberForm') memberForm!: NgForm;

  members: Member[] = [];
  filteredMembers: Member[] = [];
  familyHeads: Member[] = [];
  member: Member = this.initMember();
  editMode = false;
  submitted = false;
  showDetailsModal = false;
  selectedMember: Member | null = null;
  searchTerm = '';
  sortColumn = 'name';
  sortDirection: 'asc' | 'desc' = 'asc';
  selectedFamilyHeadFormattedId: string | null = null;

  constructor(private membersService: MembersService) { }

  ngOnInit(): void {
    this.loadMembers();
    this.loadFamilyHeads();
  }

  loadMembers(): void {
    this.membersService.getMembers().subscribe({
      next: (data) => {
        this.members = data;
        this.filteredMembers = [...this.members];
        this.sortMembers();
      },
      error: (error) => {
        console.error('Error fetching members', error);
      }
    });
  }
  
  loadFamilyHeads(): void {
    this.membersService.getFamilyHeads().subscribe({
      next: (heads) => {
        this.familyHeads = heads;
        console.log('Loaded family heads:', this.familyHeads);
      },
      error: (error) => {
        console.error('Error fetching family heads', error);
      }
    });
  }

  initMember(): Member {
    return {
      id: null,
      memberNumber: null,
      parentId: null,
      name: '',
      dateOfBirth: null,
      dateOfBaptism: null,
      dateOfConfirmation: null,
      dateOfMarriage: null,
      permanentAddress: '',
      presentAddress: '',
      mobileNumber: ''
    };
  }

  onSubmit(): void {
    this.submitted = true;
    
    if (this.memberForm.invalid) {
      return;
    }

    console.log('Submitting member with parentId:', this.member.parentId);

    if (this.editMode) {
      this.membersService.updateMember(this.member).subscribe({
        next: (updatedMember) => {
          console.log('Member updated successfully:', updatedMember);
          const index = this.members.findIndex(m => m.id === updatedMember.id);
          if (index !== -1) {
            this.members[index] = updatedMember;
            this.filteredMembers = [...this.members];
            this.sortMembers();
          }
          
          // If this member is a family head, refresh the family heads list
          if (!updatedMember.parentId) {
            this.loadFamilyHeads();
          }
          
          this.resetForm();
        },
        error: (error) => {
          console.error('Error updating member', error);
        }
      });
    } else {
      this.membersService.createMember(this.member).subscribe({
        next: (newMember) => {
          this.members.push(newMember);
          this.filteredMembers = [...this.members];
          
          // If this member is a family head, refresh the family heads list
          if (!newMember.parentId) {
            this.loadFamilyHeads();
          }
          
          this.sortMembers();
          this.resetForm();
        },
        error: (error) => {
          console.error('Error creating member', error);
        }
      });
    }
  }

  editMember(member: Member): void {
    this.editMode = true;
    this.member = { ...member };
    
    // Convert string dates to Date objects for the form
    if (this.member.dateOfBirth) {
      this.member.dateOfBirth = new Date(this.member.dateOfBirth);
    }
    if (this.member.dateOfBaptism) {
      this.member.dateOfBaptism = new Date(this.member.dateOfBaptism);
    }
    if (this.member.dateOfConfirmation) {
      this.member.dateOfConfirmation = new Date(this.member.dateOfConfirmation);
    }
    if (this.member.dateOfMarriage) {
      this.member.dateOfMarriage = new Date(this.member.dateOfMarriage);
    }
    
    // Update the selected family head ID display
    this.onFamilyHeadChange();
    
    // Scroll to form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  cancelEdit(): void {
    this.resetForm();
  }

  deleteMember(id: number | null): void {
    if (id === null) {
      return;
    }

    if (confirm('Are you sure you want to delete this member?')) {
      this.membersService.deleteMember(id).subscribe({
        next: () => {
          this.members = this.members.filter(m => m.id !== id);
          this.filteredMembers = this.filteredMembers.filter(m => m.id !== id);
          
          // If this might have been a family head, refresh the family heads list
          this.loadFamilyHeads();
        },
        error: (error) => {
          console.error('Error deleting member', error);
        }
      });
    }
  }

  resetForm(): void {
    this.submitted = false;
    this.editMode = false;
    this.member = this.initMember();
    this.selectedFamilyHeadFormattedId = null;
    if (this.memberForm) {
      this.memberForm.resetForm();
    }
  }

  viewDetails(member: Member): void {
    this.selectedMember = { ...member };
    this.showDetailsModal = true;
  }

  closeModal(): void {
    this.showDetailsModal = false;
    this.selectedMember = null;
  }
  
  getFamilyHeadName(parentId: string | null | undefined): string {
    if (!parentId) return 'None (Head of Family)';
    
    // First try to find a family head by formattedParentId
    let head = this.familyHeads.find(h => h.formattedParentId === parentId);
    
    // If not found, try to find by parentId directly
    if (!head) {
      head = this.familyHeads.find(h => h.parentId === parentId);
    }
    
    // Lastly, check if parentId is a string representation of a number
    if (!head) {
      const numericId = parseInt(parentId, 10);
      if (!isNaN(numericId)) {
        head = this.familyHeads.find(h => h.id === numericId);
      }
    }
    
    return head ? head.name : 'Unknown';
  }

  filterMembers(): void {
    if (!this.searchTerm.trim()) {
      this.filteredMembers = [...this.members];
    } else {
      const term = this.searchTerm.toLowerCase().trim();
      this.filteredMembers = this.members.filter(member => 
        member.name.toLowerCase().includes(term) || 
        member.mobileNumber.includes(term)
      );
    }
    this.sortMembers();
  }

  sortBy(column: string): void {
    if (this.sortColumn === column) {
      // Toggle sort direction
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
    this.sortMembers();
  }

  sortMembers(): void {
    this.filteredMembers.sort((a, b) => {
      let comparison = 0;
      
      if (this.sortColumn === 'name') {
        comparison = a.name.localeCompare(b.name);
      }
      // Add more sort columns as needed
      
      return this.sortDirection === 'asc' ? comparison : -comparison;
    });
  }
  
  onFamilyHeadChange(): void {
    if (this.member.parentId) {
      // Find the selected family head
      console.log('Looking for family head with ID:', this.member.parentId);
      console.log('Available family heads:', this.familyHeads);
      
      const selectedHead = this.familyHeads.find(head => {
        return head.formattedParentId === this.member.parentId || 
               String(head.id) === this.member.parentId;
      });
      
      if (selectedHead) {
        console.log('Found selected head:', selectedHead);
        // Set the formatted parent ID for display
        this.selectedFamilyHeadFormattedId = selectedHead.formattedParentId || 
                                           `Family ID: ${selectedHead.id}`;
      } else {
        console.log('No matching family head found');
        this.selectedFamilyHeadFormattedId = this.member.parentId;
      }
    } else {
      // No family head selected
      this.selectedFamilyHeadFormattedId = null;
    }
  }
  
  exportToExcel(): void {
    const exportData = this.filteredMembers.map(member => {
      return {
        'ID': member.id,
        'Member Number': member.memberNumber,
        'Name': member.name,
        'Date of Birth': member.dateOfBirth ? new Date(member.dateOfBirth).toLocaleDateString() : '',
        'Date of Baptism': member.dateOfBaptism ? new Date(member.dateOfBaptism).toLocaleDateString() : '',
        'Date of Confirmation': member.dateOfConfirmation ? new Date(member.dateOfConfirmation).toLocaleDateString() : '',
        'Date of Marriage': member.dateOfMarriage ? new Date(member.dateOfMarriage).toLocaleDateString() : '',
        'Permanent Address': member.permanentAddress,
        'Present Address': member.presentAddress,
        'Mobile Number': member.mobileNumber,
        'Family Head': this.getFamilyHeadName(member.parentId)
      };
    });
  
    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(exportData);
    const workbook: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Members');
    const date = new Date().toISOString().split('T')[0];
    XLSX.writeFile(workbook, `Members_${date}.xlsx`);
  }
}