import { Routes } from '@angular/router';
import { AdminLoginComponent } from './admin/admin-login/admin-login.component';
import { HomeComponent } from './home/home.component';
import { DashboardComponent } from './admin/dashboard/dashboard.component';
import { MembersComponent } from './admin/members/members.component';
import { LcfTaxComponent } from './admin/lcf-tax/lcf-tax.component';
import { IncomeExpenseComponent } from './admin/income-expense/income-expense.component';
import { UserComponent } from './admin/user/user.component';
import { ModuleAccessGuard } from './guards/module-access.guard';
import { UserAdminComponent } from './admin/user-admin/user-admin.component';
import { ResetPasswordComponent } from './admin/reset-password/reset-password.component';
import { ChristmasTaxComponent } from './admin/christmas-tax/christmas-tax.component';
import { MembersHomeComponent } from './members-home/members-home.component';
import { XmasTaxHomeComponent } from './xmas-tax-home/xmas-tax-home.component';
import { LcfTaxHomeComponent } from './lcf-tax-home/lcf-tax-home.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
{path:'lcf-home',component:LcfTaxHomeComponent},
{path:'members-home',component:MembersHomeComponent},
{path:'xmas-home',component:XmasTaxHomeComponent},

  //  admin
  { 
     path: 'adminlogin',
     component: AdminLoginComponent 
    },
  {
    path:'user-admin-login',
    component:UserAdminComponent
  },
   {
     path: 'reset-password',
     component: ResetPasswordComponent
   },
  {
    path: 'admindash',
    component: DashboardComponent
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
    data: { module: 'incomeExpense' }
  },
  {
    path: 'user',
    component: UserComponent,
    canActivate: [ModuleAccessGuard],
    data: { module: 'user' }
  },
  {
    path:'xmas-tax',
    component:ChristmasTaxComponent,
    canActivate:[ModuleAccessGuard],
    data:{module:'xmas'}
  }
];


