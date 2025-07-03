import { Component, OnInit } from '@angular/core';
import {
  ChristmasTaxService,
  FamilyHead,
  TaxPayment,
  TaxSummary,
} from '../services/admin/christmas-tax/christmas-tax.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MembersService } from '../services/admin/members/members.service';
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
interface TaxPaymentWithId extends TaxPayment {
  id?: number | null;
}

@Component({
  selector: 'app-xmas-tax-home',
  imports: [CommonModule, FormsModule],
  templateUrl: './xmas-tax-home.component.html',
  styleUrl: './xmas-tax-home.component.css',
})
export class XmasTaxHomeComponent implements OnInit {
  selectedYear: number | string = new Date().getFullYear();
  availableYears: (number | string)[] = [];
  selectedFamilyId: string = 'All Members';
  selectedStatus: string = 'All';
  searchText: string = '';

  familyHeads: FamilyHead[] = [];
  taxSummary: TaxSummary = {
    year: 0,
    total: 0,
    totalMembers: 0,
    paidMembers: 0,
    unpaidMembers: 0,
    collectionRate: 0,
    totalTaxAmount: 0,
    paidTaxAmount: 0,
    unpaidTaxAmount: 0,
  };

  memberTaxDetails: TaxPayment[] = [];
filteredMembers: TaxPaymentWithId[] = [];
  memberss: Member[] = [];
  isLoading = false;

  constructor(private taxService: ChristmasTaxService,
      private membersService: MembersService
  ) {}

  ngOnInit(): void {
    this.generateAvailableYears();
    this.loadFamilyHeads();
    this.loadTaxData();
     this.loadMembers();
  }
 loadMembers(): void {
    this.membersService.getMembers().subscribe({
      next: (data) => {
        this.memberss = data;
      },
      error: (error) => {
        console.error('Error fetching members:', error);
      },
    });
  }

  generateAvailableYears(): void {
    const currentYear = new Date().getFullYear();
    this.availableYears = ['All Years'];
    for (let i = currentYear - 5; i <= currentYear + 1; i++) {
      this.availableYears.push(i);
    }
  }

  async loadFamilyHeads(): Promise<void> {
    this.familyHeads =
      (await this.taxService.getFamilyHeads().toPromise()) || [];
  }

  async loadTaxData(): Promise<void> {
    this.isLoading = true;

    try {
      const familyFilter =
        this.selectedFamilyId === 'All Members'
          ? undefined
          : this.selectedFamilyId;

      if (this.selectedYear === 'All Years') {
        const summaryList = await this.taxService
          .getAllYearsSummary(familyFilter)
          .toPromise();
        if (summaryList) {
          this.taxSummary = summaryList.reduce(
            (acc, yearData) => ({
              totalMembers: acc.totalMembers + yearData.totalMembers,
              paidMembers: acc.paidMembers + yearData.paidMembers,
              unpaidMembers: acc.unpaidMembers + yearData.unpaidMembers,
              collectionRate: 0,
              totalTaxAmount: acc.totalTaxAmount + yearData.totalTaxAmount,
              paidTaxAmount: acc.paidTaxAmount + yearData.paidTaxAmount,
              unpaidTaxAmount: acc.unpaidTaxAmount + yearData.unpaidTaxAmount,
              year: 0,
              total: acc.total + yearData.total,
            }),
            {
              totalMembers: 0,
              paidMembers: 0,
              unpaidMembers: 0,
              collectionRate: 0,
              totalTaxAmount: 0,
              paidTaxAmount: 0,
              unpaidTaxAmount: 0,
              year: 0,
              total: 0,
            }
          );

          this.taxSummary.collectionRate =
            this.taxSummary.totalMembers > 0
              ? Math.round(
                  (this.taxSummary.paidMembers / this.taxSummary.totalMembers) *
                    100
                )
              : 0;
        }

        this.memberTaxDetails =
          (await this.taxService
            .getAllYearsMemberDetails(familyFilter)
            .toPromise()) || [];
      } else {
        const summary = await this.taxService
          .getTaxSummary(this.selectedYear as number, familyFilter)
          .toPromise();
        if (summary) {
          this.taxSummary = summary;
        }
        this.memberTaxDetails =
          (await this.taxService
            .getMemberTaxDetails(this.selectedYear as number, familyFilter)
            .toPromise()) || [];
      }

      this.applyFilters();
    } catch (error) {
      console.error('Error loading Christmas tax data:', error);
    } finally {
      this.isLoading = false;
    }
  }

  onYearChange(): void {
    this.loadTaxData();
  }

  onFamilyChange(): void {
    this.loadTaxData();
  }

applyFilters(): void {
  const search = this.searchText.toLowerCase();

  this.filteredMembers = this.memberTaxDetails
    .filter((member) => {
      const matchesSearch =
        member.name.toLowerCase().includes(search) ||
        member.familyId.toLowerCase().includes(search);

      const matchesStatus =
        this.selectedStatus === 'All' ||
        (this.selectedStatus === 'Paid' && member.isPaid) ||
        (this.selectedStatus === 'Unpaid' && !member.isPaid);

      return matchesSearch && matchesStatus;
    })
    .map((member) => {
      const matchedMember = this.memberss.find((m) => m.name === member.name);
      return {
        ...member,
        id: matchedMember ? matchedMember.id : null,
      };
    });
}


  formatCurrency(amount: number): string {
    return `₹${amount.toLocaleString()}`;
  }
  resetFilters() {
    this.selectedYear = new Date().getFullYear().toString();
    this.selectedFamilyId = 'All Members';
    this.selectedStatus = 'All';
    this.searchText = '';
    this.applyFilters();
  }
}
