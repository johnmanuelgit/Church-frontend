import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TaxSummaryService } from '../../services/admin/tax-summary/tax-summary.service';

interface Income {
  _id?: string;
  type: 'Donation' | 'Offering' | 'Other';
  donorName: string;
  amount: number;
  date: string; // ISO format
  year: number;
}

interface Expense {
  _id?: string;
  reason: string;
  amount: number;
  responsiblePerson: string;
  billBy: string;
  date: string; // ISO format
  year: number;
}


@Component({
  selector: 'app-income-expense',
  standalone:true,
  imports: [CommonModule,FormsModule],
  templateUrl: './income-expense.component.html',
  styleUrl: './income-expense.component.css'
})
export class IncomeExpenseComponent implements OnInit {

  donationTypes = ['Offering', 'Donation', 'Other'];
  selectedDonation = '';
  customDonation = '';
  formData = new FormData();
previewUrl: string | ArrayBuffer | null = null;
  incomes: Income[] = [];
  expenses: Expense[] = [];
  selectedYear: string = new Date().getFullYear().toString();
  availableYears: string[] = [];
  taxForSelectedYear: number = 0;


  newIncome: any = {
    donorName: '',
    amount: 0,
    type: 'Donation',
    date: ''
  };
  
  newExpense = {
    reason: '',
    amount: 0,
    responsiblePerson: '',
    billBy: '',
    date: ''
  };
  

  constructor(private http: HttpClient,private taxService: TaxSummaryService) {}

  ngOnInit(): void {
    this.generateYears();
    this.loadIncomes();
    this.loadExpenses();
    this.selectedYear = new Date().getFullYear().toString();
    this.taxService.loadTaxData().subscribe({
      next: (data) => {
        this.taxService.setTaxData(data);
        this.getTax(); // Call getTax() only after data is set
      },
      error: (err) => {
        console.error('Failed to load tax summary', err);
      }
    });
  }
  onYearChange(year: string) {
    this.selectedYear = year;
    this.getTax(); // This will now fetch from correct year-specific data
  }
  
  getTax() {
    this.taxForSelectedYear = this.taxService.getTaxForYear(this.selectedYear);
  }
  

    
  addIncome() {
    const payload = {
      ...this.newIncome,
      year: Number(this.selectedYear),
    };
    this.http.post('https://stthomoschurch-backend.onrender.com/api/incomes', payload)
      .subscribe(() => {
        this.loadIncomes();
        this.newIncome = { donorName: '', amount: 0, type: 'Donation', date: '' };
      });
  }
  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.formData.set('billImage', file); // Update image
      const reader = new FileReader();
      reader.onload = () => {
        this.previewUrl = reader.result;
      };
      reader.readAsDataURL(file);
    }
  }
  
  addExpense() {
    // Append text fields to form data
    for (const key in this.newExpense) {
      this.formData.set(
        key,
        String(this.newExpense[key as keyof typeof this.newExpense])
      );
      
    }
    
    // Send to backend
    this.http.post('https://stthomoschurch-backend.onrender.com/api/expenses', this.formData).subscribe(
      (res) => {
        alert('Expense added successfully!');
        this.resetForm();
      },
      (err) => console.error(err)
    );
  }
  
  resetForm() {
    this.newExpense = { reason: '', amount: 0, responsiblePerson: '', billBy: '', date: '' };
    this.formData = new FormData();
    this.previewUrl = null;
  }

  generateYears() {
    const currentYear = new Date().getFullYear();
    const startYear = 2020;
    this.availableYears = [];
  
    for (let y = currentYear + 1; y >= startYear; y--) {
      this.availableYears.push(y.toString());
    }
  }
  

  loadIncomes() {
    this.http.get<Income[]>('https://stthomoschurch-backend.onrender.com/api/incomes')
      .subscribe(data => this.incomes = data);
  }

  loadExpenses() {
    this.http.get<Expense[]>('https://stthomoschurch-backend.onrender.com/api/expenses')
      .subscribe(data => this.expenses = data);
  }
  get totalTaxFromLCF(): number {
    return this.taxForSelectedYear;
  }

  

  getSummary() {
    let incomes = this.incomes;
    let expenses = this.expenses;
  
    if (this.selectedYear !== 'All') {
      incomes = incomes.filter(i => i.year.toString() === this.selectedYear);
      expenses = expenses.filter(e => e.year.toString() === this.selectedYear);
    }
  
    const totalIncome = incomes.reduce((sum, i) => sum + i.amount, 0);
    const taxCollected = this.totalTaxFromLCF;
    const totalWithTax = totalIncome + taxCollected;
  
    const totalExpense = expenses.reduce((sum, e) => sum + e.amount, 0);
    const balance = totalWithTax - totalExpense;
  
    return { totalIncome, totalWithTax, totalExpense, balance };
  }
  

  
}
