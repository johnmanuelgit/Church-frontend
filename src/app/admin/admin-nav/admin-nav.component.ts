import { Component } from '@angular/core';
import { AuthService } from '../../services/admin/auth/auth.service';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-admin-nav',
  imports: [RouterModule],
  templateUrl: './admin-nav.component.html',
  styleUrl: './admin-nav.component.css'
})
export class AdminNavComponent {
  constructor (private authService:AuthService){}

   logout(): void {
    this.authService.logout()
  }

}
