import { Component, OnInit } from '@angular/core';
import { MembersService } from '../../services/admin/members/members.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-members',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './members.component.html',
  styleUrls: ['./members.component.css']
})
export class MembersComponent implements OnInit {
  user = this.getEmptyUser();
  members: any[] = [];
  editIndex = -1;

  constructor(private memberservice: MembersService) {}

  ngOnInit(): void {
    this.loadMembers();
  }

  loadMembers() {
    this.memberservice.getMembers().subscribe({
      next: (data: any[]) => {
        // Group by familyId
        const grouped: Record<string, any[]> = {};
  
        for (const member of data) {
          const fid = member.familyId || 'Unknown';
          if (!grouped[fid]) grouped[fid] = [];
          grouped[fid].push(member);
        }
  
        // Sort inside each group: head first, then others
        this.members = Object.values(grouped).flatMap(group => {
          const head = group.find(m => m.name === m.familyHead);
          const others = group.filter(m => m.name !== m.familyHead);
          return head ? [head, ...others] : group;
        });
      },
      error: (err) => {
        console.error('Error loading members:', err);
      }
    });
  }
  

  onSubmit() {
    if (this.editIndex === -1) {
      this.memberservice.addMember({ ...this.user }).subscribe({
        next: (response) => {
          this.members.push(response);
          this.resetForm();
        },
        error: (err) => {
          console.error('Failed to add member:', err);
        }
      });
    } else {
      const id = this.members[this.editIndex]._id;
      this.memberservice.updateMember(id, this.user).subscribe({
        next: (response) => {
          this.members[this.editIndex] = response;
          this.editIndex = -1;
          this.resetForm();
        },
        error: (err) => {
          console.error('Failed to update member:', err);
        }
      });
    }
  }

  edit(i: number) {
    this.user = { ...this.members[i] };
    this.editIndex = i;
  }

  delete(i: number) {
    const id = this.members[i]._id;
    this.memberservice.deleteMember(id).subscribe({
      next: () => {
        this.members.splice(i, 1);
      },
      error: (err) => {
        console.error('Failed to delete member:', err);
      }
    });
  }

  onFamilyHeadSelect(headName: string) {
    const head = this.members.find(m => m.name === headName && m.name === m.familyHead);
    this.user.familyId = head ? head.familyId : '';
  }

  getFamilyHeads(): string[] {
    return this.members
      .filter(m => m.name === m.familyHead)
      .map(m => m.name);
  }

  resetForm() {
    this.user = this.getEmptyUser();
    this.editIndex = -1;
  }

  private getEmptyUser() {
    return {
      name: '',
      dob: '',
      nativeaddress: '',
      currentaddress: '',
      mobilenum: '',
      baptism: '',
      solidifying: '',
      familyHead: '',
      marriagedate: '',
      familyId: ''
    };
  }
}
