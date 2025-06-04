// src/app/components/tax-management/tax-management.component.ts
import { Component, OnInit } from '@angular/core';
import { TaxService, TaxRate, TaxPayment, TaxSummary, FamilyHead } from '../../services/admin/tax/tax.service';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';

// Extended interface for member details with year-wise payments
interface ExtendedTaxPayment extends TaxPayment {
  yearlyPayments?: { [year: number]: { isPaid: boolean; status: string; paidAmount: number; taxAmount: number } };
}

@Component({
  selector: 'app-lcf-tax',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatSnackBarModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatProgressSpinnerModule,
    MatTooltipModule
  ],
  templateUrl: './lcf-tax.component.html',
  styleUrls: ['./lcf-tax.component.css']
})
export class LcfTaxComponent implements OnInit {
  // Data properties
  selectedYear: number | string = new Date().getFullYear();
  selectedFamilyId: string = 'All Members';
  availableYears: (number | string)[] = [];
  familyHeads: FamilyHead[] = [];
  
  // Tax configuration - Initialize with proper structure
  taxRates: TaxRate = {
    year: new Date().getFullYear(),
    adultTax: 1000,
    childTax: 500,
    adultAgeThreshold: 18,
    isActive: true
  };

  // Store original rates for cancel functionality
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
    total: 0
  };

  // Member details
  memberTaxDetails: ExtendedTaxPayment[] = [];
  filteredMembers: ExtendedTaxPayment[] = [];
  
  // UI state
  isEditingRates = false;
  isLoading = false;
  isSavingRates = false;
  displayedColumns: string[] = ['name', 'age', 'taxAmount', 'status', 'actions'];

  constructor(
    private taxService: TaxService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadInitialData();
  }

  async loadInitialData(): Promise<void> {
    this.isLoading = true;
    try {
      // Generate years automatically (current year + 5 previous years + 5 future years)
      this.generateAvailableYears();
      
      // Load family heads
      this.familyHeads = await this.taxService.getFamilyHeads().toPromise() || [];
      console.log('Family heads:', this.familyHeads);
      
      // Load tax data for current year
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
    const years: (number | string)[] = ['All Years']; // Add "All Years" option
    
    // Add years from 5 years ago to 5 years in the future
    for (let i = currentYear - 5; i <= currentYear + 5; i++) {
      years.push(i);
    }
    
    this.availableYears = years;
    console.log('Generated available years:', this.availableYears);
  }

  async loadTaxData(): Promise<void> {
    try {
      if (this.selectedYear === 'All Years') {
        // For "All Years", load summary data and hide tax rate configuration
        await this.loadAllYearsSummary();
        return;
      }

      const year = this.selectedYear as number;
      console.log('Loading tax data for year:', year);
      
      // Load tax rates first
      const taxRatesResponse = await this.taxService.getTaxRates(year).toPromise();
      if (taxRatesResponse) {
        this.taxRates = taxRatesResponse;
        this.originalTaxRates = { ...taxRatesResponse };
        console.log('Loaded tax rates:', this.taxRates);
      }
      
      // Generate tax payments if they don't exist
      await this.taxService.generateTaxPayments(year).toPromise();
      console.log('Generated tax payments for year:', year);
      
      // Load summary and details
      await Promise.all([
        this.loadTaxSummary(),
        this.loadMemberDetails()
      ]);
    } catch (error) {
      this.showSnackBar('Error loading tax data');
      console.error('Error loading tax data:', error);
    }
  }

  async loadAllYearsSummary(): Promise<void> {
    try {
      // Load summary data for all years
      const familyFilter = this.selectedFamilyId === 'All Members' ? undefined : this.selectedFamilyId;
      const allYearsSummary = await this.taxService.getAllYearsSummary(familyFilter).toPromise();
      
      if (allYearsSummary) {
        // Aggregate all years data
        this.taxSummary = allYearsSummary.reduce((acc, yearData) => ({
          totalMembers: acc.totalMembers + yearData.totalMembers,
          paidMembers: acc.paidMembers + yearData.paidMembers,
          unpaidMembers: acc.unpaidMembers + yearData.unpaidMembers,
          collectionRate: 0, // Will calculate below
          totalTaxAmount: acc.totalTaxAmount + yearData.totalTaxAmount,
          paidTaxAmount: acc.paidTaxAmount + yearData.paidTaxAmount,
          unpaidTaxAmount: acc.unpaidTaxAmount + yearData.unpaidTaxAmount,
          year: 0, // All years
          total: acc.total + yearData.total
        }), {
          totalMembers: 0,
          paidMembers: 0,
          unpaidMembers: 0,
          collectionRate: 0,
          totalTaxAmount: 0,
          paidTaxAmount: 0,
          unpaidTaxAmount: 0,
          year: 0,
          total: 0
        });

        // Calculate overall collection rate
        this.taxSummary.collectionRate = this.taxSummary.totalMembers > 0 
          ? Math.round((this.taxSummary.paidMembers / this.taxSummary.totalMembers) * 100) 
          : 0;
      }

      // Load all years member details with year-wise payment status
      await this.loadAllYearsMemberDetails();
    } catch (error) {
      console.error('Error loading all years summary:', error);
    }
  }

 // Update the displayedColumns when in "All Years" view
async loadAllYearsMemberDetails(): Promise<void> {
  try {
    const familyFilter = this.selectedFamilyId === 'All Members' ? undefined : this.selectedFamilyId;
    
    // Get all unique members first
    const allMembers = await this.taxService.getAllMembers(familyFilter).toPromise();
    
    if (allMembers) {
      const membersWithYearlyPayments: ExtendedTaxPayment[] = [];
      const yearsToShow = this.getAvailableYearsForDisplay();
      
      for (const member of allMembers) {
        const memberPayments: ExtendedTaxPayment = {
          ...member,
          yearlyPayments: {}
        };
        
        for (const year of yearsToShow) {
          try {
            const yearlyPayments = await this.taxService.getMemberPaymentForYear(member._id, year).toPromise();
            const yearlyPayment = yearlyPayments?.[0];

            memberPayments.yearlyPayments![year] = yearlyPayment ? {
              isPaid: yearlyPayment.isPaid,
              status: yearlyPayment.isPaid ? 'Paid' : 'Unpaid',
              paidAmount: yearlyPayment.paidAmount,
              taxAmount: yearlyPayment.taxAmount
            } : {
              isPaid: false,
              status: 'Not Generated',
              paidAmount: 0,
              taxAmount: 0
            };
          } catch (error) {
            memberPayments.yearlyPayments![year] = {
              isPaid: false,
              status: 'Not Generated',
              paidAmount: 0,
              taxAmount: 0
            };
          }
        }
        
        membersWithYearlyPayments.push(memberPayments);
      }
      
      this.memberTaxDetails = membersWithYearlyPayments;
      this.filteredMembers = [...membersWithYearlyPayments];
      
      // Update display columns to include yearly status
      this.displayedColumns = [
        'name', 
        'age',
        ...yearsToShow.map(year => `year-${year}`)
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

      // Use family head's familyId for filtering, not the head's name
      const familyFilter = this.selectedFamilyId === 'All Members' ? undefined : this.selectedFamilyId;
      const summary = await this.taxService.getTaxSummary(this.selectedYear as number, familyFilter).toPromise();
      
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

      // Use family head's familyId for filtering, not the head's name
      const familyFilter = this.selectedFamilyId === 'All Members' ? undefined : this.selectedFamilyId;
      const details = await this.taxService.getMemberTaxDetails(this.selectedYear as number, familyFilter).toPromise();
      
      if (details) {
        this.memberTaxDetails = details;
        this.filteredMembers = [...details];
        
        // Reset display columns for single year view
        this.displayedColumns = ['name', 'age', 'taxAmount', 'status', 'actions'];
        
        console.log('Loaded member details:', this.memberTaxDetails);
      }
    } catch (error) {
      console.error('Error loading member details:', error);
    }
  }

  async onYearChange(): Promise<void> {
    console.log('Year changed to:', this.selectedYear);
    this.isLoading = true;
    this.isEditingRates = false; // Cancel any ongoing edits
    await this.loadTaxData();
    this.isLoading = false;
  }

  async onFamilyChange(): Promise<void> {
    console.log('Family changed to:', this.selectedFamilyId);
    this.isLoading = true;
    await Promise.all([
      this.loadTaxSummary(),
      this.loadMemberDetails()
    ]);
    this.isLoading = false;
  }

  toggleEditRates(): void {
    if (this.isEditingRates) {
      // Cancel editing - restore original values
      this.taxRates = { ...this.originalTaxRates };
      this.isEditingRates = false;
      console.log('Cancelled editing, restored rates:', this.taxRates);
    } else {
      // Start editing - save current values as backup
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
      adultAgeThreshold: this.taxRates.adultAgeThreshold
    });

    try {
      this.isSavingRates = true;
      
      // Prepare the update payload
      const updatePayload = {
        adultTax: Number(this.taxRates.adultTax),
        childTax: Number(this.taxRates.childTax),
        adultAgeThreshold: Number(this.taxRates.adultAgeThreshold)
      };

      console.log('Update payload:', updatePayload);

      const updatedRates = await this.taxService.updateTaxRates(this.selectedYear as number, updatePayload).toPromise();
      
      if (updatedRates) {
        this.taxRates = updatedRates;
        this.originalTaxRates = { ...updatedRates };
        this.isEditingRates = false;
        this.showSnackBar('Tax rates updated successfully. Member tax amounts will be recalculated.');
        console.log('Rates saved successfully:', updatedRates);
        
        // Regenerate tax payments with new rates (this will update member tax amounts)
        await this.taxService.generateTaxPayments(this.selectedYear as number).toPromise();
        
        // Reload data to reflect changes
        await this.loadTaxData();
      }
    } catch (error) {
      this.showSnackBar('Error updating tax rates: ' + (error as any)?.error?.message || 'Unknown error');
      console.error('Error updating tax rates:', error);
    } finally {
      this.isSavingRates = false;
    }
  }

  private validateRates(): boolean {
    // Validate adult tax
    if (!this.taxRates.adultTax || this.taxRates.adultTax <= 0) {
      this.showSnackBar('Adult tax must be greater than 0');
      return false;
    }

    // Validate child tax
    if (!this.taxRates.childTax || this.taxRates.childTax < 0) {
      this.showSnackBar('Child tax must be 0 or greater');
      return false;
    }

    // Validate age threshold
    if (!this.taxRates.adultAgeThreshold || this.taxRates.adultAgeThreshold < 1 || this.taxRates.adultAgeThreshold > 100) {
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
        paidAmount
      });
      
      const updatePayload = {
        isPaid: newStatus,
        paidAmount: paidAmount,
        paymentMethod: 'cash'
      };

      await this.taxService.updatePaymentStatus(payment._id, updatePayload).toPromise();
      
      // Update local data
      payment.isPaid = newStatus;
      payment.paidAmount = paidAmount;
      payment.status = newStatus ? 'Paid' : 'Unpaid';
      
      this.showSnackBar(`Payment ${newStatus ? 'marked as paid' : 'marked as unpaid'}`);
      
      // Refresh summary
      await this.loadTaxSummary();
    } catch (error) {
      this.showSnackBar('Error updating payment status');
      console.error('Error updating payment status:', error);
    }
  }

  async exportReport(): Promise<void> {
    try {
      const familyFilter = this.selectedFamilyId === 'All Members' ? undefined : this.selectedFamilyId;
      let reportData;
      
      if (this.selectedYear === 'All Years') {
        reportData = await this.taxService.exportAllYearsReport(familyFilter).toPromise();
      } else {
        reportData = await this.taxService.exportTaxReport(this.selectedYear as number, familyFilter).toPromise();
      }
      
      if (reportData && reportData.data) {
        // Convert to CSV and download
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
    link.download = `LCF_Tax_Report_${this.selectedYear}_${this.getFamilyDisplayName(this.selectedFamilyId)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  private convertToCSV(data: any[]): string {
    if (!data.length) return '';
    
    const headers = Object.keys(data[0]);
    const csvHeaders = headers.join(',');
    const csvRows = data.map(row => 
      headers.map(header => {
        const value = row[header] || '';
        // Escape quotes and wrap in quotes if contains comma
        return `"${String(value).replace(/"/g, '""')}"`;
      }).join(',')
    );
    
    return [csvHeaders, ...csvRows].join('\n');
  }

  getFamilyDisplayName(familyId: string): string {
    if (familyId === 'All Members') return 'All Members';
    const family = this.familyHeads.find(f => f.familyId === familyId);
    return family ? `${family.name} Family` : familyId;
  }

    // Get family head name by family ID
  getFamilyHeadName(familyId: string): string {
    const family = this.familyHeads.find(f => f.familyId === familyId);
    return family ? family.name : '';
  }

  private showSnackBar(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      horizontalPosition: 'right',
      verticalPosition: 'top'
    });
  }

  // Enhanced filter methods for search functionality
  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value.toLowerCase();
    this.filteredMembers = this.memberTaxDetails.filter(member =>
      member.name.toLowerCase().includes(filterValue) ||
      member.familyId.toLowerCase().includes(filterValue) ||
      this.getFamilyHeadName(member.familyId).toLowerCase().includes(filterValue)
    );
  }

  // Utility methods
  formatCurrency(amount: number): string {
    return `₹${amount.toLocaleString()}`;
  }

  formatDate(date: Date | string): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString();
  }

  // Check if tax rate configuration should be shown
  shouldShowTaxRateConfig(): boolean {
    return this.selectedYear !== 'All Years';
  }

  // Get year display text
  getYearDisplayText(): string {
    return this.selectedYear === 'All Years' ? 'All Years' : this.selectedYear.toString();
  }

  // Method to refresh all data
  async refreshData(): Promise<void> {
    this.isLoading = true;
    await this.loadTaxData();
    this.isLoading = false;
    this.showSnackBar('Data refreshed successfully');
  }

  // Get available years for yearly status display
  getAvailableYearsForDisplay(): number[] {
    return this.availableYears.filter(year => year !== 'All Years') as number[];
  }

  // Get yearly payment status for a member
  getYearlyPaymentStatus(member: ExtendedTaxPayment, year: number): { status: string; class: string } {
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