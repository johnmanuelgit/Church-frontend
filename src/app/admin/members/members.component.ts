import { Component, OnInit } from '@angular/core';
import { MembersService } from '../../services/admin/members/members.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-members',
  standalone:true,
  imports: [CommonModule,FormsModule],
  templateUrl: './members.component.html',
  styleUrl: './members.component.css'
})
export class MembersComponent implements OnInit {
  user = {
    name: '',
    dob: '',
    nativeaddress: '',
    currentaddress: '',
    mobilenum: '',
    baptism: '',
    solidifying: '',
    familyHead: '', 
     marriagedate: ''
  };
  members: any[] = [];
  editIndex = -1;


  constructor(private memberservice:MembersService){}

  ngOnInit(): void {
    this.memberservice.getMembers().subscribe({
      next: (data: any) => {
        this.members = data;
        console.log('Members loaded from backend:', this.members);
      },
      error: (err) => {
        console.error('Error loading members:', err);
      }
    });
  }
  

  OnSubmit() {
    if (this.editIndex === -1) {
      const id = this.members.length + 1;
      const newMember = { id, ...this.user, taxPaid: false };
  
      this.memberservice.addMember(newMember).subscribe({
        next: (response) => {
          console.log('Member added:', response);
          this.members.push(newMember);
          this.resetForm();
        },
        error: (err) => {
          console.error('Failed to add member:', err);
        }
      });
    }  else {
      // UPDATE EXISTING MEMBER
      const updatedMember = { ...this.user };
      const id = this.members[this.editIndex].id;
  
      this.memberservice.updateMember(id, updatedMember).subscribe({
        next: (response) => {
          console.log('Member updated:', response);
          this.members[this.editIndex] = updatedMember;
          this.editIndex = -1;
          this.resetForm();
        },
        error: (err) => {
          console.error('Failed to update member:', err);
        }
      });
    }
  }
  
  resetForm() {
    this.user = {
      name: '',
      dob: '',
      nativeaddress: '',
      currentaddress: '',
      mobilenum: '',
      baptism: '',
      solidifying: '',
      familyHead: '',
       marriagedate: ''
    };
  }
  

  Edit(i: number) {
    this.user = { ...this.members[i] };
    this.editIndex = i;
  }

  Delete(i: number) {
    const id = this.members[i].id; // Get the backend ID of the member

    this.memberservice.deleteMember(id).subscribe({
      next: () => {
        console.log('Member deleted from backend');
        this.members.splice(i, 1); // Remove from local array only after successful delete
      },
      error: (err) => {
        console.error('Failed to delete member:', err);
      }
    });
  }

  getFamilyHeads(): string[] {
    return [...new Set(this.members.map(m => m.name))]; // All members can be heads
  }
}
