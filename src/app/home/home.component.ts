import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink, RouterModule } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone:true,
  imports: [CommonModule,RouterModule,RouterLink],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent {
  Offeringlist =false;
  open(){this.Offeringlist=true
  }
close(){
  this.Offeringlist=false
}
livelink(){
  window.open('https://www.youtube.com/@stthomaschurch2337/streams','_blank')
}
}
