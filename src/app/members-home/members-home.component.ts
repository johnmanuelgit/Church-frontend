import { Component, OnInit } from '@angular/core';
import { MembersService } from '../services/admin/members/members.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import * as XLSX from 'xlsx';

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
  selector: 'app-members-home',
  imports: [CommonModule, FormsModule],
  templateUrl: './members-home.component.html',
  styleUrl: './members-home.component.css',
})
export class MembersHomeComponent implements OnInit {
  currentDate: Date = new Date();
  members: Member[] = [];
  filteredMembers: Member[] = [];
  familyHeads: Member[] = [];

  searchText = '';
  searchFamilyId = '';
  selectedHeadId = '';

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
      },
      error: (error) => {
        console.error('Error fetching members:', error);
      },
    });
  }

  loadFamilyHeads(): void {
    this.membersService.getFamilyHeads().subscribe({
      next: (heads) => {
        this.familyHeads = heads;
      },
      error: (error) => {
        console.error('Error fetching family heads:', error);
      },
    });
  }

  applyFilters(): void {
    const search = this.searchText.toLowerCase().trim();
    const familyIdFilter = this.searchFamilyId.toLowerCase().trim();
    const headIdFilter = this.selectedHeadId;

    this.filteredMembers = this.members.filter((member) => {
      const matchesSearch =
        member.name.toLowerCase().includes(search) ||
        member.mobileNumber.includes(search);

      const matchesFamilyId =
        !familyIdFilter ||
        (member.familyId &&
          member.familyId.toLowerCase().includes(familyIdFilter));

      const matchesHead = !headIdFilter || member.familyId === headIdFilter;

      return matchesSearch && matchesFamilyId && matchesHead;
    });
  }

  getFamilyHeadName(familyId: string | null): string {
    if (!familyId) return 'N/A';
    const head = this.familyHeads.find((h) => h.familyId === familyId);
    return head ? head.name : 'Unknown';
  }

  exportToExcel(): void {
    const exportData = this.filteredMembers.map((member) => ({
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
      'Family ID': member.familyId || '',
      'Family Head': this.getFamilyHeadName(member.familyId),
    }));

    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(exportData);
    const workbook: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Member Details');
    const date = new Date().toISOString().split('T')[0];
    XLSX.writeFile(workbook, `Member_Details_${date}.xlsx`);
  }
  resetFilters() {
    this.searchText = '';
    this.searchFamilyId = '';
    this.selectedHeadId = '';
    this.applyFilters();
  }
}
