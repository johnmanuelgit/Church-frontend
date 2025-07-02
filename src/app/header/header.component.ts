import { Component, HostListener, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-header',
  imports: [RouterModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css',
})
export class HeaderComponent implements OnInit {
  isHidden = false;
  lastScrollPosition = 0;
  mobileMenuOpen = false;
  servicesMenuOpen = false;
  constructor(private router: Router) {}

  ngOnInit() {
    this.lastScrollPosition = window.pageYOffset;
  }
  @HostListener('window:scroll', ['$event'])
  onWindowScroll() {
    const currentScrollPosition = window.pageYOffset;

    if (
      currentScrollPosition > this.lastScrollPosition &&
      currentScrollPosition > 100
    ) {
      this.isHidden = true;
    } else if (currentScrollPosition < this.lastScrollPosition) {
      this.isHidden = false;
    }

    if (this.mobileMenuOpen && currentScrollPosition > 50) {
      this.mobileMenuOpen = false;
    }

    this.lastScrollPosition = currentScrollPosition;
  }
  toggleMobileMenu() {
    this.mobileMenuOpen = !this.mobileMenuOpen;
  }
  toggleServicesMenu() {
    this.servicesMenuOpen = !this.servicesMenuOpen;
  }
  scrollToServices() {
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
