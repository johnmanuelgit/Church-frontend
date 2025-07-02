import { Component, OnInit } from '@angular/core';
import { User, UserAdminService } from '../../services/admin/user-admin/user-admin.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminNavComponent } from "../admin-nav/admin-nav.component";



@Component({
  selector: 'app-user',
  imports: [CommonModule, FormsModule, AdminNavComponent],
  templateUrl: './user.component.html',
  styleUrl: './user.component.css'
})

export class UserComponent implements OnInit {
  admins: User[] = [];
  editMode: boolean = false;
  selectedAdmin: User | null = null;
  // In user.component.ts
  admin: User = {
    username: '',  // Changed from 'name' to 'username'
    email: '',
    password: '',
    role: 'admin',
    isActive: true,
    moduleAccess: {
      lcf: false,
      incomeExpense: false,
      members: false,
      user: false,
      xmas:false
    }
  };


  constructor(private useradminService: UserAdminService) { }

  ngOnInit() {
    this.loadAdmins();
  }

  createAdmin() {
    console.log(this.admin);

    this.useradminService.createAdminBySuperAdmin(this.admin).subscribe({
      next: () => {
        alert('Admin created successfully');
        this.loadAdmins(); // <-- Refresh list
        // In user.component.ts
        this.admin = {
          username: '',  // Changed from 'name' to 'username'
          email: '',
          password: '',
          role: 'admin',
          isActive: true,
          moduleAccess: {
            lcf: false,
            incomeExpense: false,
            members: false,
            user: false,
            xmas:false
          }
        };
      },
      error: err => alert('Error: ' + err.message)
    });
  }

  loadAdmins() {
    this.useradminService.getAllAdmins().subscribe(data => this.admins = data);
  }

  edit(user: User) {
    this.selectedAdmin = { ...user };
    this.editMode = true;
  }

  save() {
    if (!this.selectedAdmin?._id) return;

    this.useradminService.editAdmin(this.selectedAdmin._id, this.selectedAdmin).subscribe(() => {
      this.editMode = false;
      this.selectedAdmin = null;
      this.loadAdmins();
    });
  }

  cancel() {
    this.editMode = false;
    this.selectedAdmin = null;
  }

  delete(id: string) {
    if (confirm('Are you sure?')) {
      this.useradminService.deleteAdmin(id).subscribe(() => {
        this.loadAdmins();
      });
    }
  }
}

