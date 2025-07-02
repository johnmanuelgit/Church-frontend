import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ViewChild, ElementRef } from '@angular/core';
import { FamilyHead, TaxPayment, TaxRate, TaxService, TaxSummary } from '../../services/admin/tax/tax.service';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ChristmasTaxService } from '../../services/admin/christmas-tax/christmas-tax.service';
import { ServerLinkService } from '../../services/admin/server-link/server-link.service';
import { AdminNavComponent } from "../admin-nav/admin-nav.component";

interface ExtendedTaxPayment extends TaxPayment {
  yearlyPayments?: { [year: number]: { isPaid: boolean; status: string; paidAmount: number; taxAmount: number } };
}

interface Income {
  id?: string;
  _id?: string;
  donorName: string;
  amount: number;
  donationType: string;
  otherDonation?: string;
  date: string; // ISO format
  year: number;
}

interface Expense {
  id?: string;
  _id?: string;
  reason: string;
  amount: number;
  responsiblePerson: string;
  billBy: string;
  date: string; // ISO format
  year: number;
  billImage?: string;
}

@Component({
  selector: 'app-income-expense',
  standalone: true,
  imports: [CommonModule, FormsModule, MatSnackBarModule, AdminNavComponent],
  templateUrl: './income-expense.component.html',
  styleUrl: './income-expense.component.css'
})

export class IncomeExpenseComponent implements OnInit {
  @ViewChild('editExpenseForm') editExpenseFormRef!: ElementRef;
  donationTypes = ['Offering', 'Donation', 'Other'];
  selectedDonation = '';
  customDonation = '';
  formData = new FormData();
  previewUrl: string | ArrayBuffer | null = null;
  selectedFamilyId: string = 'All Members';

  // Updated to follow interface definitions
  incomeList: Income[] = [];
  expenseList: Expense[] = [];
  selectedYear: number | string = new Date().getFullYear();
  taxForSelectedYear!: TaxSummary | null;
  isEditingIncome: boolean = false;
  isEditingExpense: boolean = false;
  editingIncomeId: any | null = null;
  editingExpenseId: any | null = null;
  familyHeads: FamilyHead[] = [];
  memberTaxDetails: ExtendedTaxPayment[] = [];
  availableYears: (number | string)[] = [];

  newIncome: Income = {
    donorName: '',
    amount: 0,
    donationType: '',
    date: new Date().toISOString().split('T')[0],
    year: new Date().getFullYear()
  };

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

  newExpense: Expense = {
    reason: '',
    amount: 0,
    responsiblePerson: '',
    billBy: '',
    date: new Date().toISOString().split('T')[0],
    year: new Date().getFullYear()
  };

  taxRates: TaxRate = {
    year: new Date().getFullYear(),
    adultTax: 1000,
    childTax: 500,
    adultAgeThreshold: 18,
    isActive: true
  };
christmasTaxSummary: TaxSummary = {
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
  christmasTaxForSelectedYear!: TaxSummary | null;
christmasMemberTaxDetails: ExtendedTaxPayment[] = [];
filteredChristmasMembers: ExtendedTaxPayment[] = [];
currentFile: File | null = null;

  displayedColumns: string[] = ['name', 'age', 'taxAmount', 'status', 'actions'];
  filteredMembers: ExtendedTaxPayment[] = [];
  originalTaxRates: TaxRate = { ...this.taxRates };
server='';
  isLoading = false;
  private apiBaseUrl = 'api';

  constructor(private http: HttpClient, private taxService: TaxService, private snackBar: MatSnackBar,private christmasTaxService:ChristmasTaxService ,private serverlinkservice:ServerLinkService) { 
    this.server=this.serverlinkservice.server
  }

  ngOnInit(): void {
    this.generateYears();
    this.selectedYear = new Date().getFullYear().toString();
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

      // Load tax service data first
      await this.loadTaxServiceData();

      // Load income and expense data
      this.loadIncomes();
      this.loadExpenses();
      this.loadChristmasTaxData()

      // Load tax data for current year
      await this.loadTaxData();
    } catch (error) {
      this.showSnackBar('Error loading initial data');
      console.error('Error loading initial data:', error);
    } finally {
      this.isLoading = false;
    }
  }

  // NEW METHOD: Load tax service data
  async loadTaxServiceData(): Promise<void> {
    try {
      const taxData = await this.taxService.getAllYearsSummary().toPromise();
      if (taxData) {
        this.taxService.setTaxData(taxData);
        console.log('Loaded tax service data:', taxData);
      }
    } catch (error) {
      console.error('Error loading tax service data:', error);
    }
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

  private showSnackBar(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      horizontalPosition: 'right',
      verticalPosition: 'top'
    });
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

  private generateAvailableYears(): void {
    const currentYear = new Date().getFullYear();
    const years: (number | string)[] = ['All Years']; // Add "All Years" option

    // Add years from 5 years ago to 5 years in the future
    for (let i = currentYear - 5; i <= currentYear + 1; i++) {
      years.push(i);
    }

    this.availableYears = years;
    console.log('Generated available years:', this.availableYears);
  }

  getAvailableYearsForDisplay(): number[] {
    return this.availableYears.filter(year => year !== 'All Years') as number[];
  }

  onYearChange(year: string): void {
    this.selectedYear = year;
    this.getTax();
    this.loadIncomes();
    this.loadExpenses();
this.loadChristmasTaxData();
    this.loadTaxData();
  }

  getTax(): void {
    this.taxForSelectedYear = this.taxService.getTaxDataForYear(String(this.selectedYear));
    console.log('Tax for selected year:', this.taxForSelectedYear);
  }

  // FIXED: Updated getter to use the correct tax data
  get totalTaxFromLCF(): number {
    if (this.selectedYear === 'All Years' || this.selectedYear === 'All') {
      // For "All Years", use the aggregated tax summary
      return this.taxSummary?.paidTaxAmount || 0;
    } else {
      // For specific year, use either taxSummary or taxForSelectedYear
      return this.taxSummary?.paidTaxAmount || this.taxForSelectedYear?.total || 0;
    }
  }

  // FIXED: Updated getSummary method
  getSummary() {
    let filteredIncomes = [...this.incomeList];
    let filteredExpenses = [...this.expenseList];

    if (this.selectedYear !== 'All' && this.selectedYear !== 'All Years') {
      const yearNum = parseInt(String(this.selectedYear));
      filteredIncomes = filteredIncomes.filter(i => i.year === yearNum);
      filteredExpenses = filteredExpenses.filter(e => e.year === yearNum);
    }

    const totalIncome = filteredIncomes.reduce((sum, i) => sum + i.amount, 0);
    const totalTaxFromLCF = this.totalTaxFromLCF; // Use the getter method
    const totalWithTax = totalIncome + totalTaxFromLCF;

    const totalExpense = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
    const balance = totalWithTax - totalExpense;

    return {
      totalIncome,
      totalWithTax,
      totalExpense,
      balance,
      totalTaxFromLCF // Make sure this is included in return
    };
  }

  // INCOME FUNCTIONS
  addIncome(): void {
    const payload = {
      ...this.newIncome,
      year: Number(this.selectedYear),
    };

    // Handle the "Other" donation type case
    if (payload.donationType === 'Other' && payload.otherDonation) {
      payload.donationType = payload.otherDonation;
    }

    this.http.post(`${this.apiBaseUrl}/in/incomes`, payload)
      .subscribe({
        next: () => {
          this.loadIncomes();
          this.resetIncomeForm();
        },
        error: (err) => {
          console.error('Error adding income:', err);
          alert('Failed to add income. Please try again.');
        }
      });
  }

  editIncome(income: Income): void {
    this.isEditingIncome = true;
    this.editingIncomeId = income.id || income._id;

    // Clone the income object to avoid direct reference
    this.newIncome = {
      donorName: income.donorName,
      amount: income.amount,
      donationType: income.donationType,
      date: new Date(income.date).toISOString().split('T')[0],
      year: income.year
    };

    // If it's a custom donation type
    if (!this.donationTypes.includes(income.donationType) && income.donationType !== 'Other') {
      this.newIncome.donationType = 'Other';
      this.newIncome.otherDonation = income.donationType;
    }
    // 🔽 Scroll to the form
    setTimeout(() => {
      this.editExpenseFormRef.nativeElement.scrollIntoView({ behavior: 'smooth' });
    }, 100); // Wait for DOM to render
  }

  updateIncome(): void {
    if (!this.editingIncomeId) {
      console.error('No income ID to update');
      return;
    }

    const payload = {
      ...this.newIncome,
      year: Number(this.selectedYear)
    };

    // Handle the "Other" donation type
    if (payload.donationType === 'Other' && payload.otherDonation) {
      payload.donationType = payload.otherDonation;
    }

    this.http.put(`${this.apiBaseUrl}/in/incomes/${this.editingIncomeId}`, payload)
      .subscribe({
        next: () => {
          this.loadIncomes();
          this.cancelIncomeEdit();
          // 🔽 Scroll to the form
          setTimeout(() => {
            this.editExpenseFormRef.nativeElement.scrollIntoView({ behavior: 'smooth' });
          }, 100); // Wait for DOM to render
        },
        error: (err) => {
          console.error('Error updating income:', err);
          alert('Failed to update income. Please try again.');
        }
      });
  }

  deleteIncome(id: string): void {
    if (confirm('Are you sure you want to delete this income record?')) {
      this.http.delete(`${this.apiBaseUrl}/in/incomes/${id}`)
        .subscribe({
          next: () => {
            this.loadIncomes();
          },
          error: (err) => {
            console.error('Error deleting income:', err);
            alert('Failed to delete income. Please try again.');
          }
        });
    }
  }

  cancelIncomeEdit(): void {
    this.isEditingIncome = false;
    this.editingIncomeId = null;
    this.resetIncomeForm();
  }

  resetIncomeForm(): void {
    this.newIncome = {
      donorName: '',
      amount: 0,
      donationType: '',
      date: new Date().toISOString().split('T')[0],
      year: Number(this.selectedYear)
    };
  }

  // EXPENSE FUNCTIONS
onFileSelected(event: any): void {
  const file = event.target.files[0];
  if (file) {
    this.currentFile = file;
    this.formData.set('billImage', file);

    const reader = new FileReader();
    reader.onload = () => {
      this.previewUrl = reader.result;
    };
    reader.readAsDataURL(file);
  }
}

addExpense(): void {
  this.formData = new FormData();

  const expenseWithYear = {
    ...this.newExpense,
    year: Number(this.selectedYear)
  };

  for (const key in expenseWithYear) {
    this.formData.set(key, String(expenseWithYear[key as keyof typeof expenseWithYear]));
  }

  if (this.currentFile) {
    this.formData.set('billImage', this.currentFile);
  }

  this.http.post(`${this.apiBaseUrl}/out/expenses`, this.formData)
    .subscribe({
      next: () => {
        this.loadExpenses();
        this.resetExpenseForm();
      },
      error: (err) => {
        console.error('Error adding expense:', err);
        alert('Failed to add expense. Please try again.');
      }
    });
}

editExpense(expense: Expense): void {
  this.isEditingExpense = true;
  this.editingExpenseId = expense.id || expense._id;

  this.newExpense = {
    reason: expense.reason,
    amount: expense.amount,
    responsiblePerson: expense.responsiblePerson,
    billBy: expense.billBy,
    date: new Date(expense.date).toISOString().split('T')[0],
    year: expense.year,
    billImage: expense.billImage
  };

  this.formData = new FormData();
this.previewUrl = expense.billImage ? this.server + expense.billImage : null;
  this.currentFile = null;  // Reset file so user can select a new one if needed

  setTimeout(() => {
    this.editExpenseFormRef.nativeElement.scrollIntoView({ behavior: 'smooth' });
  }, 100);
}


updateExpense(): void {
  if (!this.editingExpenseId) {
    console.error('No expense ID to update');
    return;
  }

  this.formData = new FormData();
  const expenseWithYear = {
    ...this.newExpense,
    year: Number(this.selectedYear)
  };

  for (const key in expenseWithYear) {
    this.formData.set(key, String(expenseWithYear[key as keyof typeof expenseWithYear]));
  }

  // If user selected a new file, append it
  if (this.currentFile) {
    this.formData.set('billImage', this.currentFile);
  }

  this.http.put(`${this.apiBaseUrl}/out/expenses/${this.editingExpenseId}`, this.formData)
    .subscribe({
      next: () => {
        const updatedId = this.editingExpenseId;
        this.loadExpenses();
        this.cancelExpenseEdit();

        setTimeout(() => {
          const el = document.getElementById(`expense-${updatedId}`);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 500);
      },
      error: (err) => {
        console.error('Error updating expense:', err);
        alert('Failed to update expense. Please try again.');
      }
    });
}



  deleteExpense(id: string): void {
    if (confirm('Are you sure you want to delete this expense record?')) {
      this.http.delete(`${this.apiBaseUrl}/out/expenses/${id}`)
        .subscribe({
          next: () => {
            this.loadExpenses();
          },
          error: (err) => {
            console.error('Error deleting expense:', err);
            alert('Failed to delete expense. Please try again.');
          }
        });
    }
  }

  cancelExpenseEdit(): void {
    this.isEditingExpense = false;
    this.editingExpenseId = null;
    this.resetExpenseForm();
  }

resetExpenseForm(): void {
  this.newExpense = {
    reason: '',
    amount: 0,
    responsiblePerson: '',
    billBy: '',
    date: new Date().toISOString().split('T')[0],
    year: Number(this.selectedYear)
  };
  this.formData = new FormData();
  this.previewUrl = null;
  this.currentFile = null;
}


  // DATA LOADING FUNCTIONS
  loadIncomes(): void {
    let url = `${this.apiBaseUrl}/in/incomes`;

    if (this.selectedYear !== 'All' && this.selectedYear !== 'All Years') {
      url += `?year=${this.selectedYear}`;
    }

    this.http.get<Income[]>(url)
      .subscribe({
        next: (data) => {
          this.incomeList = data;
        },
        error: (err) => {
          console.error('Error loading incomes:', err);
        }
      });
  }


  loadExpenses(): void {
    let url = `${this.apiBaseUrl}/out/expenses`;

    // Add year filter if not "All"
    if (this.selectedYear !== 'All' && this.selectedYear !== 'All Years') {
      url += `?year=${this.selectedYear}`;
    }

    this.http.get<Expense[]>(url)
      .subscribe({
        next: (data) => {
          this.expenseList = data;
        },
        error: (err) => {
          console.error('Error loading expenses:', err);
        }
      });
  }

  // UTILITY FUNCTIONS
  generateYears(): void {
    const currentYear = new Date().getFullYear();
    const startYear = 2020;
    this.availableYears = [];

    for (let y = currentYear + 1; y >= startYear; y--) {
      this.availableYears.push(y.toString());
    }
  }

  // Export data to CSV
  exportToCSV(): void {
    const year = this.selectedYear;
    const incomeData = this.incomeList.map(income => {
      const date = new Date(income.date).toLocaleDateString();
      return `"${date}","${income.donorName}","${income.donationType}","${income.amount}"`;
    });

    const expenseData = this.expenseList.map(expense => {
      const date = new Date(expense.date).toLocaleDateString();
      return `"${date}","${expense.reason}","${expense.responsiblePerson}","${expense.billBy}","${expense.amount}"`;
    });

    const summary = this.getSummary();

    let csvContent = "Income Records - " + year + "\n";
    csvContent += "Date,Donor Name,Donation Type,Amount(₹)\n";
    csvContent += incomeData.join('\n') + "\n\n";

    csvContent += "Expense Records - " + year + "\n";
    csvContent += "Date,Reason,Responsible Person,Bill By,Amount(₹)\n";
    csvContent += expenseData.join('\n') + "\n\n";

    csvContent += "Summary\n";
    csvContent += `Total Tax Collected,₹${summary.totalTaxFromLCF}\n`;
    csvContent += `Total Income (without tax),₹${summary.totalIncome}\n`;
    csvContent += `Total Income (with tax),₹${summary.totalWithTax}\n`;
    csvContent += `Total Expense,₹${summary.totalExpense}\n`;
    csvContent += `Balance,₹${summary.balance}\n`;

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);

    // Create download link
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', `financial-report-${year}.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  // Filter functions
  filterByDonationType(type: string): void {
    let url = `${this.apiBaseUrl}/in/incomes?donationType=${type}`;

    if (this.selectedYear !== 'All' && this.selectedYear !== 'All Years') {
      url += `&year=${this.selectedYear}`;
    }

    this.http.get<Income[]>(url)
      .subscribe({
        next: (data) => {
          this.incomeList = data;
        },
        error: (err) => {
          console.error('Error filtering incomes:', err);
        }
      });
  }

  searchIncomesByDonor(searchTerm: string): void {
    if (!searchTerm.trim()) {
      this.loadIncomes();
      return;
    }

    let url = `${this.apiBaseUrl}/in/incomes/search?term=${searchTerm}`;

    if (this.selectedYear !== 'All' && this.selectedYear !== 'All Years') {
      url += `&year=${this.selectedYear}`;
    }

    this.http.get<Income[]>(url)
      .subscribe({
        next: (data) => {
          this.incomeList = data;
        },
        error: (err) => {
          console.error('Error searching incomes:', err);
        }
      });
  }

  searchExpensesByReason(searchTerm: string): void {
    if (!searchTerm.trim()) {
      this.loadExpenses();
      return;
    }

    let url = `${this.apiBaseUrl}/out/expenses/search?term=${searchTerm}`;

    if (this.selectedYear !== 'All' && this.selectedYear !== 'All Years') {
      url += `&year=${this.selectedYear}`;
    }

    this.http.get<Expense[]>(url)
      .subscribe({
        next: (data) => {
          this.expenseList = data;
        },
        error: (err) => {
          console.error('Error searching expenses:', err);
        }
      });
  }
  async loadChristmasTaxData(): Promise<void> {
  try {
    if (this.selectedYear === 'All Years') {
      await this.loadAllYearsChristmasSummary();
      return;
    }

    const year = this.selectedYear as number;
    console.log('Loading Christmas tax data for year:', year);

    // Generate Christmas tax payments if they don't exist
    await this.christmasTaxService.generateTaxPayments(year).toPromise();
    console.log('Generated Christmas tax payments for year:', year);

    // Load summary and details
    await Promise.all([
      this.loadChristmasTaxSummary(),
      this.loadChristmasMemberDetails()
    ]);
  } catch (error) {
    this.showSnackBar('Error loading Christmas tax data');
    console.error('Error loading Christmas tax data:', error);
  }
}

async loadChristmasTaxSummary(): Promise<void> {
  try {
    if (this.selectedYear === 'All Years') {
      await this.loadAllYearsChristmasSummary();
      return;
    }

    const familyFilter = this.selectedFamilyId === 'All Members' ? undefined : this.selectedFamilyId;
    const summary = await this.christmasTaxService.getTaxSummary(this.selectedYear as number, familyFilter).toPromise();

    if (summary) {
      this.christmasTaxSummary = summary;
      console.log('Loaded Christmas tax summary:', this.christmasTaxSummary);
    }
  } catch (error) {
    console.error('Error loading Christmas tax summary:', error);
  }
}

async loadChristmasMemberDetails(): Promise<void> {
  try {
    if (this.selectedYear === 'All Years') {
      await this.loadAllYearsChristmasMemberDetails();
      return;
    }

    const familyFilter = this.selectedFamilyId === 'All Members' ? undefined : this.selectedFamilyId;
    const details = await this.christmasTaxService.getMemberTaxDetails(this.selectedYear as number, familyFilter).toPromise();

    if (details) {
      this.christmasMemberTaxDetails = details;
      this.filteredChristmasMembers = [...details];
      console.log('Loaded Christmas member details:', this.christmasMemberTaxDetails);
    }
  } catch (error) {
    console.error('Error loading Christmas member details:', error);
  }
}

async loadAllYearsChristmasSummary(): Promise<void> {
  try {
    const familyFilter = this.selectedFamilyId === 'All Members' ? undefined : this.selectedFamilyId;
    const allYearsSummary = await this.christmasTaxService.getAllYearsSummary(familyFilter).toPromise();

    if (allYearsSummary) {
      this.christmasTaxSummary = allYearsSummary.reduce((acc, yearData) => ({
        totalMembers: acc.totalMembers + yearData.totalMembers,
        paidMembers: acc.paidMembers + yearData.paidMembers,
        unpaidMembers: acc.unpaidMembers + yearData.unpaidMembers,
        collectionRate: 0,
        totalTaxAmount: acc.totalTaxAmount + yearData.totalTaxAmount,
        paidTaxAmount: acc.paidTaxAmount + yearData.paidTaxAmount,
        unpaidTaxAmount: acc.unpaidTaxAmount + yearData.unpaidTaxAmount,
        year: 0,
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

      this.christmasTaxSummary.collectionRate = this.christmasTaxSummary.totalMembers > 0
        ? Math.round((this.christmasTaxSummary.paidMembers / this.christmasTaxSummary.totalMembers) * 100)
        : 0;
    }

    await this.loadAllYearsChristmasMemberDetails();
  } catch (error) {
    console.error('Error loading all years Christmas summary:', error);
  }
}

async loadAllYearsChristmasMemberDetails(): Promise<void> {
  try {
    const familyFilter = this.selectedFamilyId === 'All Members' ? undefined : this.selectedFamilyId;
    const allMembers = await this.christmasTaxService.getAllMembers(familyFilter).toPromise();

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
            const yearlyPayments = await this.christmasTaxService.getMemberPaymentForYear(member._id, year).toPromise();
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

      this.christmasMemberTaxDetails = membersWithYearlyPayments;
      this.filteredChristmasMembers = [...membersWithYearlyPayments];
    }
  } catch (error) {
    console.error('Error loading all years Christmas member details:', error);
    this.showSnackBar('Error loading Christmas member details');
  }
}

get totalChristmasTax(): number {
  if (this.selectedYear === 'All Years' || this.selectedYear === 'All') {
    return this.christmasTaxSummary?.paidTaxAmount || 0;
  } else {
    return this.christmasTaxSummary?.paidTaxAmount || this.christmasTaxForSelectedYear?.total || 0;
  }
}
}