import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import {
  ChristmasTaxService,
  FamilyHead,
  TaxPayment,
  TaxRate,
  TaxSummary,
} from '../../services/admin/christmas-tax/christmas-tax.service';
import { AdminNavComponent } from '../admin-nav/admin-nav.component';

interface ExtendedTaxPayment extends TaxPayment {
  yearlyPayments?: {
    [year: number]: {
      isPaid: boolean;
      status: string;
      paidAmount: number;
      taxAmount: number;
    };
  };
}

@Component({
  selector: 'app-christmas-tax',
  imports: [
    CommonModule,
    FormsModule,
    MatSnackBarModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    AdminNavComponent,
  ],
  templateUrl: './christmas-tax.component.html',
  styleUrl: './christmas-tax.component.css',
})
export class ChristmasTaxComponent implements OnInit {
  selectedYear: number | string = new Date().getFullYear();
  selectedFamilyId: string = 'All Members';
  availableYears: (number | string)[] = [];
  familyHeads: FamilyHead[] = [];

  taxRates: TaxRate = {
    year: new Date().getFullYear(),
    adultTax: 1000,
    childTax: 500,
    adultAgeThreshold: 18,
    isActive: true,
  };

  originalTaxRates: TaxRate = { ...this.taxRates };

  taxSummary: TaxSummary = {
    totalMembers: 0,
    paidMembers: 0,
    unpaidMembers: 0,
    collectionRate: 0,
    totalTaxAmount: 0,
    paidTaxAmount: 0,
    unpaidTaxAmount: 0,
    year: new Date().getFullYear(),
    total: 0,
  };

  memberTaxDetails: ExtendedTaxPayment[] = [];
  filteredMembers: ExtendedTaxPayment[] = [];

  isEditingRates = false;
  isLoading = false;
  isSavingRates = false;
  displayedColumns: string[] = [
    'name',
    'age',
    'taxAmount',
    'status',
    'actions',
  ];

  constructor(
    private taxService: ChristmasTaxService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadInitialData();
  }

  async loadInitialData(): Promise<void> {
    this.isLoading = true;
    try {
      this.generateAvailableYears();

      this.familyHeads =
        (await this.taxService.getFamilyHeads().toPromise()) || [];
      console.log('Family heads:', this.familyHeads);

      await this.loadTaxData();
    } catch (error) {
      this.showSnackBar('Error loading initial data');
      console.error('Error loading initial data:', error);
    } finally {
      this.isLoading = false;
    }
  }

  private generateAvailableYears(): void {
    const currentYear = new Date().getFullYear();
    const years: (number | string)[] = ['All Years'];

    for (let i = currentYear - 5; i <= currentYear + 1; i++) {
      years.push(i);
    }

    this.availableYears = years;
    console.log('Generated available years:', this.availableYears);
  }

  async loadTaxData(): Promise<void> {
    try {
      if (this.selectedYear === 'All Years') {
        await this.loadAllYearsSummary();
        return;
      }

      const year = this.selectedYear as number;
      console.log('Loading tax data for year:', year);

      const taxRatesResponse = await this.taxService
        .getTaxRates(year)
        .toPromise();
      if (taxRatesResponse) {
        this.taxRates = taxRatesResponse;
        this.originalTaxRates = { ...taxRatesResponse };
        console.log('Loaded tax rates:', this.taxRates);
      }

      await this.taxService.generateTaxPayments(year).toPromise();
      console.log('Generated tax payments for year:', year);

      await Promise.all([this.loadTaxSummary(), this.loadMemberDetails()]);
    } catch (error) {
      this.showSnackBar('Error loading tax data');
      console.error('Error loading tax data:', error);
    }
  }

  async loadAllYearsSummary(): Promise<void> {
    try {
      const familyFilter =
        this.selectedFamilyId === 'All Members'
          ? undefined
          : this.selectedFamilyId;
      const allYearsSummary = await this.taxService
        .getAllYearsSummary(familyFilter)
        .toPromise();

      if (allYearsSummary) {
        this.taxSummary = allYearsSummary.reduce(
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

      await this.loadAllYearsMemberDetails();
    } catch (error) {
      console.error('Error loading all years summary:', error);
    }
  }

  async loadAllYearsMemberDetails(): Promise<void> {
    try {
      const familyFilter =
        this.selectedFamilyId === 'All Members'
          ? undefined
          : this.selectedFamilyId;

      const allMembers = await this.taxService
        .getAllMembers(familyFilter)
        .toPromise();

      if (allMembers) {
        const membersWithYearlyPayments: ExtendedTaxPayment[] = [];
        const yearsToShow = this.getAvailableYearsForDisplay();

        for (const member of allMembers) {
          const memberPayments: ExtendedTaxPayment = {
            ...member,
            yearlyPayments: {},
          };

          for (const year of yearsToShow) {
            try {
              const yearlyPayments = await this.taxService
                .getMemberPaymentForYear(member._id, year)
                .toPromise();
              const yearlyPayment = yearlyPayments?.[0];

              memberPayments.yearlyPayments![year] = yearlyPayment
                ? {
                    isPaid: yearlyPayment.isPaid,
                    status: yearlyPayment.isPaid ? 'Paid' : 'Unpaid',
                    paidAmount: yearlyPayment.paidAmount,
                    taxAmount: yearlyPayment.taxAmount,
                  }
                : {
                    isPaid: false,
                    status: 'Not Generated',
                    paidAmount: 0,
                    taxAmount: 0,
                  };
            } catch (error) {
              memberPayments.yearlyPayments![year] = {
                isPaid: false,
                status: 'Not Generated',
                paidAmount: 0,
                taxAmount: 0,
              };
            }
          }

          membersWithYearlyPayments.push(memberPayments);
        }

        this.memberTaxDetails = membersWithYearlyPayments;
        this.filteredMembers = [...membersWithYearlyPayments];

        this.displayedColumns = [
          'name',
          'age',
          ...yearsToShow.map((year) => `year-${year}`),
        ];
      }
    } catch (error) {
      console.error('Error loading all years member details:', error);
      this.showSnackBar('Error loading member details');
    }
  }
  async loadTaxSummary(): Promise<void> {
    try {
      if (this.selectedYear === 'All Years') {
        await this.loadAllYearsSummary();
        return;
      }

      const familyFilter =
        this.selectedFamilyId === 'All Members'
          ? undefined
          : this.selectedFamilyId;
      const summary = await this.taxService
        .getTaxSummary(this.selectedYear as number, familyFilter)
        .toPromise();

      if (summary) {
        this.taxSummary = summary;
        console.log('Loaded tax summary:', this.taxSummary);
      }
    } catch (error) {
      console.error('Error loading tax summary:', error);
    }
  }

  async loadMemberDetails(): Promise<void> {
    try {
      if (this.selectedYear === 'All Years') {
        await this.loadAllYearsMemberDetails();
        return;
      }

      const familyFilter =
        this.selectedFamilyId === 'All Members'
          ? undefined
          : this.selectedFamilyId;
      const details = await this.taxService
        .getMemberTaxDetails(this.selectedYear as number, familyFilter)
        .toPromise();

      if (details) {
        this.memberTaxDetails = details;
        this.filteredMembers = [...details];

        this.displayedColumns = [
          'name',
          'age',
          'taxAmount',
          'status',
          'actions',
        ];

        console.log('Loaded member details:', this.memberTaxDetails);
      }
    } catch (error) {
      console.error('Error loading member details:', error);
    }
  }

  async onYearChange(): Promise<void> {
    console.log('Year changed to:', this.selectedYear);
    this.isLoading = true;
    this.isEditingRates = false;
    await this.loadTaxData();
    this.isLoading = false;
  }

  async onFamilyChange(): Promise<void> {
    console.log('Family changed to:', this.selectedFamilyId);
    this.isLoading = true;
    await Promise.all([this.loadTaxSummary(), this.loadMemberDetails()]);
    this.isLoading = false;
  }

  toggleEditRates(): void {
    if (this.isEditingRates) {
      this.taxRates = { ...this.originalTaxRates };
      this.isEditingRates = false;
      console.log('Cancelled editing, restored rates:', this.taxRates);
    } else {
      this.originalTaxRates = { ...this.taxRates };
      this.isEditingRates = true;
      console.log('Started editing rates');
    }
  }

  async saveRates(): Promise<void> {
    if (!this.validateRates()) {
      return;
    }

    console.log('Saving rates:', {
      year: this.selectedYear,
      adultTax: this.taxRates.adultTax,
      childTax: this.taxRates.childTax,
      adultAgeThreshold: this.taxRates.adultAgeThreshold,
    });

    try {
      this.isSavingRates = true;

      const updatePayload = {
        adultTax: Number(this.taxRates.adultTax),
        childTax: Number(this.taxRates.childTax),
        adultAgeThreshold: Number(this.taxRates.adultAgeThreshold),
      };

      console.log('Update payload:', updatePayload);

      const updatedRates = await this.taxService
        .updateTaxRates(this.selectedYear as number, updatePayload)
        .toPromise();

      if (updatedRates) {
        this.taxRates = updatedRates;
        this.originalTaxRates = { ...updatedRates };
        this.isEditingRates = false;
        this.showSnackBar(
          'Tax rates updated successfully. Member tax amounts will be recalculated.'
        );
        console.log('Rates saved successfully:', updatedRates);

        await this.taxService
          .generateTaxPayments(this.selectedYear as number)
          .toPromise();

        await this.loadTaxData();
      }
    } catch (error) {
      this.showSnackBar(
        'Error updating tax rates: ' + (error as any)?.error?.message ||
          'Unknown error'
      );
      console.error('Error updating tax rates:', error);
    } finally {
      this.isSavingRates = false;
    }
  }

  private validateRates(): boolean {
    if (!this.taxRates.adultTax || this.taxRates.adultTax <= 0) {
      this.showSnackBar('Adult tax must be greater than 0');
      return false;
    }

    if (!this.taxRates.childTax || this.taxRates.childTax < 0) {
      this.showSnackBar('Child tax must be 0 or greater');
      return false;
    }

    if (
      !this.taxRates.adultAgeThreshold ||
      this.taxRates.adultAgeThreshold < 1 ||
      this.taxRates.adultAgeThreshold > 100
    ) {
      this.showSnackBar('Adult age threshold must be between 1 and 100');
      return false;
    }

    return true;
  }

  async togglePaymentStatus(payment: TaxPayment): Promise<void> {
    try {
      const newStatus = !payment.isPaid;
      const paidAmount = newStatus ? payment.taxAmount : 0;

      console.log('Toggling payment status:', {
        paymentId: payment._id,
        newStatus,
        paidAmount,
      });

      const updatePayload = {
        isPaid: newStatus,
        paidAmount: paidAmount,
        paymentMethod: 'cash',
      };

      await this.taxService
        .updatePaymentStatus(payment._id, updatePayload)
        .toPromise();

      payment.isPaid = newStatus;
      payment.paidAmount = paidAmount;
      payment.status = newStatus ? 'Paid' : 'Unpaid';

      this.showSnackBar(
        `Payment ${newStatus ? 'marked as paid' : 'marked as unpaid'}`
      );

      await this.loadTaxSummary();
    } catch (error) {
      this.showSnackBar('Error updating payment status');
      console.error('Error updating payment status:', error);
    }
  }

  async exportReport(): Promise<void> {
    try {
      const familyFilter =
        this.selectedFamilyId === 'All Members'
          ? undefined
          : this.selectedFamilyId;
      let reportData;

      if (this.selectedYear === 'All Years') {
        reportData = await this.taxService
          .exportAllYearsReport(familyFilter)
          .toPromise();
      } else {
        reportData = await this.taxService
          .exportTaxReport(this.selectedYear as number, familyFilter)
          .toPromise();
      }

      if (reportData && reportData.data) {
        this.downloadCSV(reportData.data);
        this.showSnackBar('Report exported successfully');
      }
    } catch (error) {
      this.showSnackBar('Error exporting report');
      console.error('Error exporting report:', error);
    }
  }

  private downloadCSV(reportData: any[]): void {
    const csvContent = this.convertToCSV(reportData);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `LCF_Tax_Report_${
      this.selectedYear
    }_${this.getFamilyDisplayName(this.selectedFamilyId)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  private convertToCSV(data: any[]): string {
    if (!data.length) return '';

    const headers = Object.keys(data[0]);
    const csvHeaders = headers.join(',');
    const csvRows = data.map((row) =>
      headers
        .map((header) => {
          const value = row[header] || '';

          return `"${String(value).replace(/"/g, '""')}"`;
        })
        .join(',')
    );

    return [csvHeaders, ...csvRows].join('\n');
  }

  getFamilyDisplayName(familyId: string): string {
    if (familyId === 'All Members') return 'All Members';
    const family = this.familyHeads.find((f) => f.familyId === familyId);
    return family ? `${family.name} Family` : familyId;
  }

  getFamilyHeadName(familyId: string): string {
    const family = this.familyHeads.find((f) => f.familyId === familyId);
    return family ? family.name : '';
  }

  private showSnackBar(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      horizontalPosition: 'right',
      verticalPosition: 'top',
    });
  }

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value.toLowerCase();
    this.filteredMembers = this.memberTaxDetails.filter(
      (member) =>
        member.name.toLowerCase().includes(filterValue) ||
        member.familyId.toLowerCase().includes(filterValue) ||
        this.getFamilyHeadName(member.familyId)
          .toLowerCase()
          .includes(filterValue)
    );
  }

  formatCurrency(amount: number): string {
    return `₹${amount.toLocaleString()}`;
  }

  formatDate(date: Date | string): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString();
  }

  shouldShowTaxRateConfig(): boolean {
    return this.selectedYear !== 'All Years';
  }

  getYearDisplayText(): string {
    return this.selectedYear === 'All Years'
      ? 'All Years'
      : this.selectedYear.toString();
  }

  async refreshData(): Promise<void> {
    this.isLoading = true;
    await this.loadTaxData();
    this.isLoading = false;
    this.showSnackBar('Data refreshed successfully');
  }

  getAvailableYearsForDisplay(): number[] {
    return this.availableYears.filter(
      (year) => year !== 'All Years'
    ) as number[];
  }

  getYearlyPaymentStatus(
    member: ExtendedTaxPayment,
    year: number
  ): { status: string; class: string } {
    if (!member.yearlyPayments || !member.yearlyPayments[year]) {
      return { status: 'Not Generated', class: 'status-not-generated' };
    }

    const payment = member.yearlyPayments[year];
    if (payment.isPaid) {
      return { status: 'Paid', class: 'status-paid' };
    } else if (payment.taxAmount > 0) {
      return { status: 'Unpaid', class: 'status-unpaid' };
    } else {
      return { status: 'Not Generated', class: 'status-not-generated' };
    }
  }
}
