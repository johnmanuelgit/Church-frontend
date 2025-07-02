import { Component } from '@angular/core';
import { AuthService } from '../../services/admin/auth/auth.service';
import { RouterLink, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-admin-nav',
  imports: [RouterModule,RouterLink,CommonModule],
  templateUrl: './admin-nav.component.html',
  styleUrl: './admin-nav.component.css'
})
export class AdminNavComponent {
    menuOpen: boolean = false;
    currentTime = '';
  constructor (private authService:AuthService)
  {
     const now = new Date();
    this.currentTime = now.toLocaleTimeString();
  }

   logout(): void {
    this.authService.logout()
  }

}
