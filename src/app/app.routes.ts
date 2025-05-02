import { Routes } from '@angular/router';
import { AdminLoginComponent } from './admin/admin-login/admin-login.component';
import { HomeComponent } from './home/home.component';
import { DashboardComponent } from './admin/dashboard/dashboard.component';
import { MembersComponent } from './admin/members/members.component';
import { LcfTaxComponent } from './admin/lcf-tax/lcf-tax.component';
import { IncomeExpenseComponent } from './admin/income-expense/income-expense.component';

export const routes: Routes = [
    { path: "", component: HomeComponent },
    { path: 'adminlogin', component: AdminLoginComponent },
    { path: 'admindash', component: DashboardComponent },
    { path: 'members', component: MembersComponent },
    { path: 'lcftax', component: LcfTaxComponent },
    { path: 'income&expense', component: IncomeExpenseComponent }
];
