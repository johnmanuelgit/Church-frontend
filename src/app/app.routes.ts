import { Routes } from '@angular/router';
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


export const routes: Routes = [
  { path: '', 
    loadComponent:()=>
      import('./home/home.component').then(m=>m.HomeComponent)
   },
  { path: 'lcf-home',
    loadComponent:()=>
      import('./lcf-tax-home/lcf-tax-home.component').then(m=>m.LcfTaxHomeComponent)
  },
  { path: 'members-home',
     loadComponent:()=>
    import('./members-home/members-home.component').then(m=>m.MembersHomeComponent)
     },
  { path: 'xmas-home',
    loadComponent:()=>
      import('./xmas-tax-home/xmas-tax-home.component').then(m=>m.XmasTaxHomeComponent)
   },

  {
    path: 'adminlogin',
    loadComponent:() =>
      import('./admin/admin-login/admin-login.component').then(m=>m.AdminLoginComponent)
  },
  {
    path: 'user-admin-login',
  loadComponent:()=>
    import('./admin/user-admin/user-admin.component').then(m=>m.UserAdminComponent)
  },
  {
    path: 'reset-password',
    loadComponent:()=>
      import('./admin/reset-password/reset-password.component').then(m=>m.ResetPasswordComponent)
  },
  {
    path: 'admindash',
    loadComponent:()=>
      import('./admin/dashboard/dashboard.component').then(m=>m.DashboardComponent)
  },
  {
    path: 'members',
    loadComponent:()=>
      import('./admin/members/members.component').then(m=>m.MembersComponent),
    canActivate: [ModuleAccessGuard],
    data: { module: 'members' },
  },
  {
    path: 'lcftax',
    loadComponent:()=>
      import('./admin/lcf-tax/lcf-tax.component').then(m=>m.LcfTaxComponent),
    canActivate: [ModuleAccessGuard],
    data: { module: 'lcf' },
  },
  {
    path: 'income&expense',
    loadComponent:()=>
      import('./admin/income-expense/income-expense.component').then(m=>m.IncomeExpenseComponent),
    canActivate: [ModuleAccessGuard],
    data: { module: 'incomeExpense' },
  },
  {
    path: 'user',
    loadComponent:()=>
      import('./admin/user/user.component').then(m=>m.UserComponent),
    canActivate: [ModuleAccessGuard],
    data: { module: 'user' },
  },
  {
    path: 'xmas-tax',
    loadComponent:()=>
      import('./admin/christmas-tax/christmas-tax.component').then(m=>m.ChristmasTaxComponent),
    canActivate: [ModuleAccessGuard],
    data: { module: 'xmas' },
  },
];
