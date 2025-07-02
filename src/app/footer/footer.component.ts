import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-footer',
  imports: [RouterModule],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.css'
})
export class FooterComponent {

   constructor(private router: Router) {}
   scrollToServices() {
    // If we're not on the home page, navigate there first
    if (this.router.url !== '/') {
      this.router.navigate(['/']).then(() => {
        this.scrollToElement('services');
      });
    } else {
      this.scrollToElement('services');
    }
  }
   private scrollToElement(elementId: string): void {
    const element = document.getElementById(elementId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

}
