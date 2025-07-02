import { Component, OnInit, ViewChild } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import * as XLSX from 'xlsx';
import { MembersService } from '../../services/admin/members/members.service';
import { CommonModule } from '@angular/common';
import { AdminNavComponent } from '../admin-nav/admin-nav.component';

interface Member {
  id: number | null;
  memberNumber: number | null;
  name: string;
  dateOfBirth: Date | null;
  dateOfBaptism: Date | null;
  dateOfConfirmation: Date | null;
  dateOfMarriage: Date | null;
  permanentAddress: string;
  presentAddress: string;
  mobileNumber: string;
  familyId: string | null;
  isHeadOfFamily: boolean;
}

@Component({
  selector: 'app-members',
  standalone: true,
  imports: [CommonModule, FormsModule, AdminNavComponent],
  templateUrl: './members.component.html',
  styleUrls: ['./members.component.css'],
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
  familyIdSearch = '';
  sortColumn = 'name';
  sortDirection: 'asc' | 'desc' = 'asc';

  constructor(private membersService: MembersService) {}

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
      },
    });
  }

  loadFamilyHeads(): void {
    this.membersService.getFamilyHeads().subscribe({
      next: (heads) => {
        this.familyHeads = heads;
      },
      error: (error) => {
        console.error('Error fetching family heads', error);
      },
    });
  }

  initMember(): Member {
    return {
      id: null,
      memberNumber: null,
      name: '',
      dateOfBirth: null,
      dateOfBaptism: null,
      dateOfConfirmation: null,
      dateOfMarriage: null,
      permanentAddress: '',
      presentAddress: '',
      mobileNumber: '',
      familyId: null,
      isHeadOfFamily: false,
    };
  }

  onSubmit(): void {
    this.submitted = true;

    if (this.memberForm.invalid) {
      return;
    }

    if (this.editMode) {
      this.membersService.updateMember(this.member).subscribe({
        next: (updatedMember) => {
          const index = this.members.findIndex(
            (m) => m.id === updatedMember.id
          );
          if (index !== -1) {
            this.members[index] = updatedMember;
            this.filteredMembers = [...this.members];
            this.sortMembers();
          }

          if (updatedMember.isHeadOfFamily) {
            this.loadFamilyHeads();
          }

          this.resetForm();
        },
        error: (error) => {
          console.error('Error updating member', error);
        },
      });
    } else {
      this.membersService.createMember(this.member).subscribe({
        next: (newMember) => {
          this.members.push(newMember);
          this.filteredMembers = [...this.members];

          if (newMember.isHeadOfFamily) {
            this.loadFamilyHeads();
          }

          this.sortMembers();
          this.resetForm();
        },
        error: (error) => {
          console.error('Error creating member', error);
        },
      });
    }
  }

  generateFamilyId(): void {
    if (this.member.name && this.member.mobileNumber) {
      const namePrefix = this.member.name
        .replace(/\s+/g, '')
        .slice(0, 3)
        .toUpperCase();

      const mobilePostfix = this.member.mobileNumber.slice(-3);
      this.member.familyId = `${namePrefix}${mobilePostfix}`;
    } else {
      alert('Please enter both name and mobile number to generate family ID');
    }
  }

  updateFamilyId(): void {
    if (
      this.member.isHeadOfFamily &&
      this.member.name &&
      this.member.mobileNumber
    ) {
      this.generateFamilyId();
    }
  }

  searchByFamilyId(): void {
    if (!this.familyIdSearch.trim()) {
      this.loadMembers();
      return;
    }

    this.membersService.searchByFamilyId(this.familyIdSearch.trim()).subscribe({
      next: (members) => {
        this.filteredMembers = members;
        this.members = members;
      },
      error: (error) => {
        console.error('Error searching by family ID', error);
      },
    });
  }

  editMember(member: Member): void {
    this.editMode = true;
    this.member = { ...member };

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
          this.members = this.members.filter((m) => m.id !== id);
          this.filteredMembers = this.filteredMembers.filter(
            (m) => m.id !== id
          );

          this.loadFamilyHeads();
        },
        error: (error) => {
          console.error('Error deleting member', error);
        },
      });
    }
  }

  resetForm(): void {
    this.submitted = false;
    this.editMode = false;
    this.member = this.initMember();
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

  filterMembers(): void {
    if (!this.searchTerm.trim()) {
      this.filteredMembers = [...this.members];
    } else {
      const term = this.searchTerm.toLowerCase().trim();
      this.filteredMembers = this.members.filter(
        (member) =>
          member.name.toLowerCase().includes(term) ||
          member.mobileNumber.includes(term) ||
          (member.familyId && member.familyId.toLowerCase().includes(term))
      );
    }
    this.sortMembers();
  }

  sortBy(column: string): void {
    if (this.sortColumn === column) {
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

      return this.sortDirection === 'asc' ? comparison : -comparison;
    });
  }

  exportToExcel(): void {
    const exportData = this.filteredMembers.map((member) => {
      return {
        ID: member.id,
        'Member Number': member.memberNumber,
        Name: member.name,
        'Date of Birth': member.dateOfBirth
          ? new Date(member.dateOfBirth).toLocaleDateString()
          : '',
        'Date of Baptism': member.dateOfBaptism
          ? new Date(member.dateOfBaptism).toLocaleDateString()
          : '',
        'Date of Confirmation': member.dateOfConfirmation
          ? new Date(member.dateOfConfirmation).toLocaleDateString()
          : '',
        'Date of Marriage': member.dateOfMarriage
          ? new Date(member.dateOfMarriage).toLocaleDateString()
          : '',
        'Permanent Address': member.permanentAddress,
        'Present Address': member.presentAddress,
        'Mobile Number': member.mobileNumber,
        'Family Head': member.isHeadOfFamily
          ? 'Yes'
          : this.getFamilyHeadName(member.familyId),
      };
    });

    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(exportData);
    const workbook: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Members');
    const date = new Date().toISOString().split('T')[0];
    XLSX.writeFile(workbook, `Members_${date}.xlsx`);
  }

  getFamilyHeadName(familyId: string | null): string {
    if (!familyId) return 'N/A';

    const familyHead = this.familyHeads.find(
      (head) => head.familyId === familyId
    );
    return familyHead ? familyHead.name : 'Unknown';
  }
}
