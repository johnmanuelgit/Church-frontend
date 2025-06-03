import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { RouterLink, RouterModule } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  standalone:true,
  imports: [CommonModule,RouterModule,RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  currentTime = '';
  access = JSON.parse(localStorage.getItem('admin_user') || '{"moduleAccess": {}}').moduleAccess || {};

  showLCF = this.access.lcf;
  showIncome = this.access.incomeExpense;
  showMembers = this.access.members;
  showUser = this.access.user;

  ngOnInit(): void {
    const now = new Date();
    this.currentTime = now.toLocaleTimeString();
  }
}
