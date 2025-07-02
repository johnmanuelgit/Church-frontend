import { Component, OnInit } from '@angular/core';
import {
  FamilyHead,
  TaxPayment,
  TaxService,
  TaxSummary,
} from '../services/admin/tax/tax.service';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MembersService } from '../services/admin/members/members.service';



@Component({
  selector: 'app-lcf-tax-home',
  imports: [CommonModule, FormsModule],
  templateUrl: './lcf-tax-home.component.html',
  styleUrl: './lcf-tax-home.component.css',
  providers: [DatePipe],
})
export class LcfTaxHomeComponent implements OnInit {
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
  filteredMembers: TaxPayment[] = [];

  isLoading = false;

  constructor(private taxService: TaxService,private memberservice:MembersService) {}

  ngOnInit(): void {
    this.generateAvailableYears();
    this.loadFamilyHeads();
    this.loadTaxData();
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
      console.error('Error loading tax data:', error);
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
    this.filteredMembers = this.memberTaxDetails.filter((member) => {
      const matchesSearch =
        member.name.toLowerCase().includes(search) ||
        member.familyId.toLowerCase().includes(search);

      const matchesStatus =
        this.selectedStatus === 'All' ||
        (this.selectedStatus === 'Paid' && member.isPaid) ||
        (this.selectedStatus === 'Unpaid' && !member.isPaid);

      return matchesSearch && matchesStatus;
    });
  }

  formatCurrency(amount: number): string {
    return `₹${amount.toLocaleString()}`;
  }
}
