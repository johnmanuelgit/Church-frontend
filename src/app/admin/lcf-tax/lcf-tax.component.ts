import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TaxSummaryService, TaxRecord, TaxSummary } from '../../services/admin/tax-summary/tax-summary.service';
import { HttpClient } from '@angular/common/http';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

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
  tax?: { [year: string]: { taxPaid: boolean, amount: number, paymentDate?: string } };
}

export interface TaxRateConfig {
  adult: number;
  child: number;
  adultAge: number;
  seniorAge?: number;
  seniorDiscount?: number;
}

@Component({
  selector: 'app-lcf-tax',
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule, CommonModule],
  templateUrl: './lcf-tax.component.html',
  styleUrls: ['./lcf-tax.component.css']
})
export class LcfTaxComponent implements OnInit {
  members: Member[] = [];
  filteredMembers: Member[] = [];
  selectedYear: string = new Date().getFullYear().toString();
  availableYears: string[] = [];
  
  selectedHead: string = '';
  familyMembers: Member[] = [];
  familyHeads: { id: string, name: string }[] = [];
  taxRecords: TaxRecord[] = [];
  errorMessage: string = '';
  successMessage: string = '';
  
  // Search functionality
  searchTerm: string = '';
  searchTermChanged: Subject<string> = new Subject<string>();
  
  // New properties for tax amount editing
  editingTaxAmount: { memberId: string, year: string } | null = null;
  customTaxAmount: number = 0;
  
  // Tax configuration by year
  taxConfig: { [year: string]: TaxRateConfig } = {};
  
  // Default config
  defaultTaxConfig: TaxRateConfig = {
    adult: 1000,
    child: 500,
    adultAge: 18,
    seniorAge: 60,
    seniorDiscount: 10
  };
  
  // Property for editing global tax rate configuration
  editingConfig: boolean = false;
  editingConfigYear: string = '';
  tempTaxConfig: TaxRateConfig = { ...this.defaultTaxConfig };
  
  // Bulk actions
  selectedMembers: Set<string> = new Set();
  selectAllChecked: boolean = false;
  
  // Loading state
  isLoading: boolean = false;
  
  // Statistics
  yearlyStats: { [year: string]: { totalDue: number, totalPaid: number, percentage: number } } = {};
  
  constructor(private http: HttpClient, private taxService: TaxSummaryService) {
    // Set up search with debounce
    this.searchTermChanged.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(term => {
      this.filterMembers(term);
    });
  }

  ngOnInit(): void {
    this.isLoading = true;
    this.loadMembers();
    this.generateYears();
    this.loadTaxSummary();
    this.loadTaxConfig(); // Load saved tax config from localStorage
  }
  
  // Load tax configuration from localStorage
  loadTaxConfig(): void {
    const savedConfig = localStorage.getItem('taxConfig');
    if (savedConfig) {
      this.taxConfig = JSON.parse(savedConfig);
    }
    
    // Initialize any missing years with default values
    this.availableYears.forEach(year => {
      if (!this.taxConfig[year]) {
        this.taxConfig[year] = { ...this.defaultTaxConfig };
      }
    });
  }
  
  // Save tax configuration to localStorage
  saveTaxConfigToStorage(): void {
    localStorage.setItem('taxConfig', JSON.stringify(this.taxConfig));
  }
  
  // Start editing tax configuration
  editTaxConfig(year: string): void {
    this.editingConfigYear = year;
    this.editingConfig = true;
    this.tempTaxConfig = { ...this.taxConfig[year] };
  }
  
  // Save tax configuration
saveTaxConfig(): void {
  if (this.editingConfigYear && this.tempTaxConfig) {
    // Validate inputs
    if (this.tempTaxConfig.adult < 0 || this.tempTaxConfig.child < 0 || this.tempTaxConfig.adultAge < 0) {
      this.showError('Please enter valid positive values');
      return;
    }
    
    this.isLoading = true;
    
    // Save to backend first
    this.taxService.updateTaxConfig(Number(this.editingConfigYear), this.tempTaxConfig).subscribe({
      next: () => {
        // Only update local state after successful backend update
        this.taxConfig[this.editingConfigYear] = { ...this.tempTaxConfig };
        this.saveTaxConfigToStorage();
        this.editingConfig = false;
        this.editingConfigYear = '';
        
        this.updateMemberTaxAmounts(this.editingConfigYear);
        this.showSuccess('Tax rates updated successfully');
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error saving tax config:', err);
        this.showError('Failed to save tax configuration');
        this.isLoading = false;
      }
    });
  }
}
  
  // Cancel editing tax configuration
  cancelTaxConfig(): void {
    this.editingConfig = false;
    this.editingConfigYear = '';
  }
  
  // Update all members' default tax amounts for a specific year
  updateMemberTaxAmounts(year: string): void {
    const allMembers = [...this.members];
    
    allMembers.forEach(member => {
      // Only update if not already customized
      if (!member.tax?.[year] || !member.tax[year].amount) {
        const calculatedAmount = this.calculateTax(member.dateOfBirth || member.dob, year);
        
        // Only create a record if needed
        if (calculatedAmount > 0) {
          if (!member.tax) member.tax = {};
          if (!member.tax[year]) {
            member.tax[year] = {
              taxPaid: false,
              amount: calculatedAmount
            };
          } else {
            member.tax[year].amount = calculatedAmount;
          }
        }
      }
    });
    
    // Update stats after changing tax amounts
    this.calculateYearlyStats();
  }

  loadMembers(): void {
    this.isLoading = true;
    this.http.get<Member[]>('https://stthomoschurch-backend.onrender.com/api/members').subscribe({
      next: (data) => {
        console.log('Data received:', data);
  
        this.members = data.map(m => ({
          ...m,
          tax: {}
        }));
        
        this.filteredMembers = [...this.members];
        this.loadTaxRecords();
      },
      error: (err) => {
        console.error('Failed to load members:', err);
        this.showError('Failed to load members. Please try again later.');
        this.isLoading = false;
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
        this.calculateYearlyStats();
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to load tax records:', err);
        this.showError('Failed to load tax records');
        this.isLoading = false;
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
          amount: rec.amount,
          paymentDate: rec.paymentDate
        };
      }
    }
    
    // Fill in default tax amounts for years without records
    this.members.forEach(member => {
      this.availableYears.forEach(year => {
        if (!member.tax?.[year]) {
          const defaultAmount = this.calculateTax(member.dateOfBirth || member.dob, year);
          if (!member.tax) member.tax = {};
          member.tax[year] = {
            taxPaid: false,
            amount: defaultAmount
          };
        }
      });
    });
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
    
    // Reset selected members when changing family head
    this.selectedMembers.clear();
    this.selectAllChecked = false;
  }
  
  // Calculate tax based on age for a specific year
  calculateTax(dob: string, year: string): number {
    const ageInYear = this.getAgeInYear(dob, parseInt(year));
    const config = this.taxConfig[year] || this.defaultTaxConfig;
    
    // Apply senior discount if applicable
    if (config.seniorAge && ageInYear >= config.seniorAge && config.seniorDiscount) {
      const seniorRate = config.adult * (1 - (config.seniorDiscount / 100));
      return ageInYear < config.adultAge ? config.child : seniorRate;
    }
    
    return ageInYear < config.adultAge ? config.child : config.adult;
  }

  // Calculate age as of a specific year
  getAgeInYear(dob: string, year: number): number {
    if (!dob) return 0;
    
    const birthDate = new Date(dob);
    const targetDate = new Date(year, 11, 31); // December 31 of that year
    const age = targetDate.getFullYear() - birthDate.getFullYear();
    const m = targetDate.getMonth() - birthDate.getMonth();
    return m < 0 || (m === 0 && targetDate.getDate() < birthDate.getDate()) ? age - 1 : age;
  }

  getAge(dob: string): number {
    if (!dob) return 0;
    
    const birthDate = new Date(dob);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    return m < 0 || (m === 0 && today.getDate() < birthDate.getDate()) ? age - 1 : age;
  }

  // Get tax amount - use custom amount if available, otherwise calculate default
  getTaxAmount(member: Member, year: string): number {
    if (year === 'all') {
      // Sum of all years if "all" is selected
      return Object.entries(member.tax || {}).reduce((sum, [yr, taxInfo]) => {
        return sum + (taxInfo.amount || 0);
      }, 0);
    }
    
    // Use the configured tax amount from taxConfig
    const ageInYear = this.getAgeInYear(member.dateOfBirth || member.dob, parseInt(year));
    const config = this.taxConfig[year] || this.defaultTaxConfig;
    
    // Apply senior discount if applicable
    if (config.seniorAge && ageInYear >= config.seniorAge && config.seniorDiscount) {
      const seniorRate = config.adult * (1 - (config.seniorDiscount / 100));
      return ageInYear < config.adultAge ? config.child : seniorRate;
    }
    
    return ageInYear < config.adultAge ? config.child : config.adult;
  }

  // Start editing tax amount
  editTaxAmount(member: Member): void {
    if (this.selectedYear === 'all') {
      this.showError('Please select a specific year to edit tax amount');
      return;
    }
    
    this.editingTaxAmount = {
      memberId: member._id,
      year: this.selectedYear
    };
    this.customTaxAmount = this.getTaxAmount(member, this.selectedYear);
  }

  // Save edited tax amount
  saveTaxAmount(member: Member): void {
    if (!this.customTaxAmount || this.customTaxAmount < 0) {
      this.showError('Please enter a valid tax amount');
      return;
    }

    const taxPaid = member.tax?.[this.selectedYear]?.taxPaid || false;
    
    this.taxService.updateTaxAmount(member._id, Number(this.selectedYear), this.customTaxAmount, taxPaid).subscribe({
      next: (response) => {
        // Update local data
        if (!member.tax) member.tax = {};
        member.tax[this.selectedYear] = {
          taxPaid: taxPaid,
          amount: this.customTaxAmount,
          paymentDate: member.tax[this.selectedYear]?.paymentDate
        };
        
        this.editingTaxAmount = null;
        this.loadTaxSummary(); // Refresh summary data
        this.calculateYearlyStats();
        this.showSuccess('Tax amount updated successfully');
      },
      error: (err) => {
        console.error('Error updating tax amount:', err);
        this.showError('Failed to update tax amount');
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
          yearTotal += taxInfo.amount || 0;
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
  
    // Sort family heads alphabetically
    this.familyHeads.sort((a, b) => a.name.localeCompare(b.name));
    
    console.log('Family heads:', this.familyHeads);
  }
  
  markAsPaid(member: Member) {
    if (this.selectedYear === 'all') {
      this.showError('Please select a specific year to mark payment');
      return;
    }
    
    const amount = this.getTaxAmount(member, this.selectedYear);
    
    this.taxService.markTaxPaid(member._id, Number(this.selectedYear), amount).subscribe({
      next: (response) => {
        if (!member.tax) member.tax = {};
        member.tax[this.selectedYear] = {
          taxPaid: true,
          amount: amount,
          paymentDate: new Date().toISOString().split('T')[0]
        };
        this.loadTaxSummary();
        this.calculateYearlyStats();
        this.showSuccess(`Payment recorded for ${member.name}`);
      },
      error: (err) => {
        console.error('Error marking as paid:', err);
        this.showError('Failed to mark as paid');
      }
    });
  }
  
  editPayment(member: Member) {
    if (this.selectedYear === 'all') {
      this.showError('Please select a specific year to update payment status');
      return;
    }
    
    this.taxService.markTaxUnpaid(member._id, Number(this.selectedYear)).subscribe({
      next: (response) => {
        if (member.tax && member.tax[this.selectedYear]) {
          member.tax[this.selectedYear].taxPaid = false;
          delete member.tax[this.selectedYear].paymentDate;
        }
        this.loadTaxSummary();
        this.calculateYearlyStats();
        this.showSuccess(`Payment status updated for ${member.name}`);
      },
      error: (err) => {
        console.error('Error marking as unpaid:', err);
        this.showError('Failed to mark as unpaid');  
      }
    });
  }
  
  onYearChange(): void {
    console.log("Year changed to:", this.selectedYear);
    this.selectHead();
    
    // Reset selected members when changing year
    this.selectedMembers.clear();
    this.selectAllChecked = false;
  }
  
  generateYears() {
    const currentYear = new Date().getFullYear();
    const startYear = 2020; // or your desired start year
    this.availableYears = [];
  
    for (let y = startYear; y <= currentYear + 1; y++) {
      this.availableYears.push(y.toString());
    }
    
    // Sort years in descending order (newest first)
    this.availableYears.sort((a, b) => parseInt(b) - parseInt(a));
    
    // Initialize tax config for each year
    this.availableYears.forEach(year => {
      if (!this.taxConfig[year]) {
        this.taxConfig[year] = { ...this.defaultTaxConfig };
      }
    });
    
    // Save the initialized config
    this.saveTaxConfigToStorage();
  }
  
  // Get multi-year tax details for a member
  getMemberYearlyTaxDetails(member: Member) {
    if (!member.tax) return [];
    
    return Object.entries(member.tax)
      .map(([year, taxInfo]) => ({
        year,
        amount: taxInfo.amount,
        paid: taxInfo.taxPaid,
        paymentDate: taxInfo.paymentDate
      }))
      .sort((a, b) => parseInt(b.year) - parseInt(a.year)); // Most recent first
  }
  
  getSummary() {
    let totalTax = 0;
    let paidCount = 0;
    let unpaidCount = 0;
    let paidAmount = 0;
    let unpaidAmount = 0;
  
    // Use familyMembers if head is selected, otherwise use all members
    const targetMembers = this.selectedHead ? this.familyMembers : this.filteredMembers;
    
    if (this.selectedYear === 'all') {
      // Calculate summary across all years
      targetMembers.forEach(member => {
        let memberPaid = false;
        
        Object.entries(member.tax || {}).forEach(([year, taxInfo]) => {
          const amount = taxInfo.amount || 0;
          totalTax += amount;
          
          if (taxInfo.taxPaid) {
            memberPaid = true;
            paidAmount += amount;
          } else {
            unpaidAmount += amount;
          }
        });
        
        if (memberPaid) {
          paidCount++;
        } else {
          unpaidCount++;
        }
      });
    } else {
      // Calculate for the selected year only
      targetMembers.forEach(member => {
        const taxAmount = this.getTaxAmount(member, this.selectedYear);
        totalTax += taxAmount;
        
        if (member.tax?.[this.selectedYear]?.taxPaid) {
          paidCount++;
          paidAmount += taxAmount;
        } else {
          unpaidCount++;
          unpaidAmount += taxAmount;
        }
      });
    }
  
    return {
      totalTax,
      paidCount,
      unpaidCount,
      paidAmount,
      unpaidAmount,
      totalMembers: targetMembers.length,
      paidPlusUnpaidAmount: paidAmount + unpaidAmount,
      collectionRate: totalTax > 0 ? (paidAmount / totalTax * 100).toFixed(1) : 0
    };
  }
  
  // Search functionality
  onSearchChange(event: any): void {
    this.searchTermChanged.next(event.target.value);
  }
  
  filterMembers(term: string): void {
    term = term.toLowerCase().trim();
    
    if (!term) {
      this.filteredMembers = [...this.members];
      return;
    }
    
    this.filteredMembers = this.members.filter(member => {
      return (
        member.name.toLowerCase().includes(term) ||
        member.mobilenum?.includes(term) ||
        member.currentaddress?.toLowerCase().includes(term)
      );
    });
  }
  
  // Bulk actions
  toggleSelectAll(): void {
    if (this.selectAllChecked) {
      // Select all visible members
      const targetMembers = this.selectedHead ? this.familyMembers : this.filteredMembers;
      targetMembers.forEach(member => {
        this.selectedMembers.add(member._id);
      });
    } else {
      // Deselect all
      this.selectedMembers.clear();
    }
  }
  
  toggleSelectMember(memberId: string, isSelected: boolean): void {
    if (isSelected) {
      this.selectedMembers.add(memberId);
    } else {
      this.selectedMembers.delete(memberId);
    }
    
    // Update selectAll checkbox state
    const targetMembers = this.selectedHead ? this.familyMembers : this.filteredMembers;
    this.selectAllChecked = targetMembers.length > 0 && 
      targetMembers.every(m => this.selectedMembers.has(m._id));
  }
  
  markSelectedAsPaid(): void {
    if (this.selectedYear === 'all') {
      this.showError('Please select a specific year to mark payments');
      return;
    }
    
    if (this.selectedMembers.size === 0) {
      this.showError('Please select at least one member');
      return;
    }
    
    // Count for tracking completion
    let processedCount = 0;
    const totalToProcess = this.selectedMembers.size;
    this.isLoading = true;
    
    // Process each selected member
    this.selectedMembers.forEach(memberId => {
      const member = this.members.find(m => m._id === memberId);
      if (!member) {
        processedCount++;
        if (processedCount === totalToProcess) {
          this.isLoading = false;
          this.showSuccess(`Marked ${processedCount} payments as paid`);
        }
        return;
      }
      
      const amount = this.getTaxAmount(member, this.selectedYear);
      
      this.taxService.markTaxPaid(memberId, Number(this.selectedYear), amount).subscribe({
        next: () => {
          if (!member.tax) member.tax = {};
          member.tax[this.selectedYear] = {
            taxPaid: true,
            amount: amount,
            paymentDate: new Date().toISOString().split('T')[0]
          };
          
          processedCount++;
          if (processedCount === totalToProcess) {
            this.loadTaxSummary();
            this.calculateYearlyStats();
            this.isLoading = false;
            this.showSuccess(`Marked ${processedCount} payments as paid`);
            this.selectedMembers.clear();
            this.selectAllChecked = false;
          }
        },
        error: () => {
          processedCount++;
          if (processedCount === totalToProcess) {
            this.isLoading = false;
            this.showError('Some payments could not be processed');
            this.loadTaxSummary();
            this.calculateYearlyStats();
          }
        }
      });
    });
  }
  
  // Calculate statistics for all years
  calculateYearlyStats(): void {
    this.yearlyStats = {};
    
    this.availableYears.forEach(year => {
      let totalDue = 0;
      let totalPaid = 0;
      
      this.members.forEach(member => {
        const amount = this.getTaxAmount(member, year);
        totalDue += amount;
        
        if (member.tax?.[year]?.taxPaid) {
          totalPaid += amount;
        }
      });
      
      const percentage = totalDue > 0 ? (totalPaid / totalDue * 100) : 0;
      
      this.yearlyStats[year] = {
        totalDue,
        totalPaid,
        percentage
      };
    });
  }
  
  // Helper methods for UI messaging
  showError(message: string): void {
    this.errorMessage = message;
    // Auto-clear after 5 seconds
    setTimeout(() => {
      if (this.errorMessage === message) {
        this.errorMessage = '';
      }
    }, 5000);
  }
  
  showSuccess(message: string): void {
    this.successMessage = message;
    // Auto-clear after 5 seconds
    setTimeout(() => {
      if (this.successMessage === message) {
        this.successMessage = '';
      }
    }, 5000);
  }
  
  // Generate reports
  exportToCSV(): void {
    // Get relevant data based on current view
    const targetMembers = this.selectedHead ? this.familyMembers : this.filteredMembers;
    let data: any[] = [];
    let filename = 'tax-report';
    
    if (this.selectedYear === 'all') {
      // Multi-year export
      targetMembers.forEach(member => {
        const yearlyDetails = this.getMemberYearlyTaxDetails(member);
        
        yearlyDetails.forEach(detail => {
          data.push({
            Name: member.name,
            'Date of Birth': member.dateOfBirth || member.dob,
            'Age': this.getAgeInYear(member.dateOfBirth || member.dob, +detail.year),
            'Year': detail.year,
            'Tax Amount': detail.amount,
            'Status': detail.paid ? 'Paid' : 'Unpaid',
            'Payment Date': detail.paymentDate || ''
          });
        });
      });
      
      filename = `tax-report-all-years-${new Date().toISOString().split('T')[0]}`;
    } else {
      // Single year export
      targetMembers.forEach(member => {
        data.push({
          Name: member.name,
          'Date of Birth': member.dateOfBirth || member.dob,
          'Age': this.getAgeInYear(member.dateOfBirth || member.dob, +this.selectedYear),
          'Tax Amount': this.getTaxAmount(member, this.selectedYear),
          'Status': member.tax?.[this.selectedYear]?.taxPaid ? 'Paid' : 'Unpaid',
          'Payment Date': member.tax?.[this.selectedYear]?.paymentDate || ''
        });
      });
      
      filename = `tax-report-${this.selectedYear}-${new Date().toISOString().split('T')[0]}`;
    }
    
    if (data.length === 0) {
      this.showError('No data to export');
      return;
    }
    
    // Convert to CSV
    const headers = Object.keys(data[0]);
    let csvContent = headers.join(',') + '\n';
    
    data.forEach(row => {
      const values = headers.map(header => {
        const cellValue = row[header] || '';
        // Escape quotes and wrap in quotes
        return `"${String(cellValue).replace(/"/g, '""')}"`;
      });
      csvContent += values.join(',') + '\n';
    });
    
    // Download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    this.showSuccess('Report exported successfully');
  }
}