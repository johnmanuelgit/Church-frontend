import { Routes } from '@angular/router';
import { AdminLoginComponent } from './admin/admin-login/admin-login.component';
import { HomeComponent } from './home/home.component';
import { DashboardComponent } from './admin/dashboard/dashboard.component';
import { MembersComponent } from './admin/members/members.component';
import { LcfTaxComponent } from './admin/lcf-tax/lcf-tax.component';
import { IncomeExpenseComponent } from './admin/income-expense/income-expense.component';
import { UserComponent } from './admin/user/user.component';
import { ModuleAccessGuard } from './guards/module-access.guard';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'adminlogin', component: AdminLoginComponent },
  {
    path: 'admindash',
    component: DashboardComponent,
    canActivate: [ModuleAccessGuard],
    data: { module: 'dashboard' }
  },
  {
    path: 'members',
    component: MembersComponent,
    canActivate: [ModuleAccessGuard],
    data: { module: 'members' }
  },
  {
    path: 'lcftax',
    component: LcfTaxComponent,
    canActivate: [ModuleAccessGuard],
    data: { module: 'lcf' }
  },
  {
    path: 'income&expense',
    component: IncomeExpenseComponent,
    canActivate: [ModuleAccessGuard],
    data: { module: 'finance' }
  },
  {
    path: 'user',
    component: UserComponent,
    canActivate: [ModuleAccessGuard],
    data: { module: 'users' }
  }
];


