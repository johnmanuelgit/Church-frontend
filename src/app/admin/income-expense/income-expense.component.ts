import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TaxSummaryService } from '../../services/admin/tax-summary/tax-summary.service';
import { ViewChild, ElementRef } from '@angular/core';



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
  imports: [CommonModule, FormsModule],
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
  
  // Updated to follow interface definitions
  incomeList: Income[] = [];
  expenseList: Expense[] = [];
  
  selectedYear: string = new Date().getFullYear().toString();
  availableYears: string[] = [];
  taxForSelectedYear: number = 0;
  
  // For edit functionality
  isEditingIncome: boolean = false;
  isEditingExpense: boolean = false;
  editingIncomeId: any | null = null;
  editingExpenseId: any | null = null;
  

  newIncome: Income = {
    donorName: '',
    amount: 0,
    donationType: '',
    date: new Date().toISOString().split('T')[0],
    year: new Date().getFullYear()
  };
  
  newExpense: Expense = {
    reason: '',
    amount: 0,
    responsiblePerson: '',
    billBy: '',
    date: new Date().toISOString().split('T')[0],
    year: new Date().getFullYear()
  };
  
  private apiBaseUrl = 'https://stthomoschurch-backend.onrender.com/api';

  constructor(private http: HttpClient, private taxService: TaxSummaryService) {}

  ngOnInit(): void {
    this.generateYears();
    this.loadIncomes();
    this.loadExpenses();
    this.selectedYear = new Date().getFullYear().toString();
    this.loadTaxData();
  }
  
  loadTaxData(): void {
    this.taxService.loadTaxData().subscribe({
      next: (data) => {
        this.taxService.setTaxData(data);
        this.getTax();
      },
      error: (err) => {
        console.error('Failed to load tax summary', err);
      }
    });
  }
  
  onYearChange(year: string): void {
    this.selectedYear = year;
    this.getTax();
    this.loadIncomes();
    this.loadExpenses();
  }
  
  getTax(): void {
    this.taxForSelectedYear = this.taxService.getTaxForYear(this.selectedYear);
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
      this.formData.set('billImage', file);
      const reader = new FileReader();
      reader.onload = () => {
        this.previewUrl = reader.result;
      };
      reader.readAsDataURL(file);
    }
  }
  
  addExpense(): void {
    // Create a new FormData object to avoid appending to previous data
    this.formData = new FormData();
    
    // Add year to the expense
    const expenseWithYear = {
      ...this.newExpense,
      year: Number(this.selectedYear)
    };
    
    // Append all expense data to form data
    for (const key in expenseWithYear) {
      this.formData.set(key, String(expenseWithYear[key as keyof typeof expenseWithYear]));
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
  
    // Clone the expense object
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
    this.previewUrl = expense.billImage ?? null;
  
    // 🔽 Scroll to the form
    setTimeout(() => {
      this.editExpenseFormRef.nativeElement.scrollIntoView({ behavior: 'smooth' });
    }, 100); // Wait for DOM to render
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
  
    this.http.put(`${this.apiBaseUrl}/out/expenses/${this.editingExpenseId}`, this.formData)
      .subscribe({
        next: () => {
          const updatedId = this.editingExpenseId;
          this.loadExpenses();
          this.cancelExpenseEdit();
  
          // 🔽 After a short delay, scroll to updated row
          setTimeout(() => {
            const el = document.getElementById(`expense-${updatedId}`);
            if (el) {
              el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
          }, 500); // Adjust timing if needed
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
  }

  // DATA LOADING FUNCTIONS
  loadIncomes(): void {
    let url = `${this.apiBaseUrl}/in/incomes`;
    
    if (this.selectedYear !== 'All') {
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
    if (this.selectedYear !== 'All') {
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
  
  get totalTaxFromLCF(): number {
    return this.taxForSelectedYear;
  }

  getSummary() {
    let filteredIncomes = [...this.incomeList];
    let filteredExpenses = [...this.expenseList];
  
    if (this.selectedYear !== 'All') {
      const yearNum = parseInt(this.selectedYear);
      filteredIncomes = filteredIncomes.filter(i => i.year === yearNum);
      filteredExpenses = filteredExpenses.filter(e => e.year === yearNum);
    }
  
    const totalIncome = filteredIncomes.reduce((sum, i) => sum + i.amount, 0);
    const taxCollected = this.totalTaxFromLCF;
    const totalWithTax = totalIncome + taxCollected;
  
    const totalExpense = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
    const balance = totalWithTax - totalExpense;
  
    return { totalIncome, totalWithTax, totalExpense, balance,totalTaxFromLCF: taxCollected,

     };
    
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
    
    if (this.selectedYear !== 'All') {
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
    
    if (this.selectedYear !== 'All') {
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
    
    if (this.selectedYear !== 'All') {
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
}