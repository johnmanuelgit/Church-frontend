import { Component } from '@angular/core';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { Route, Router, RouterOutlet } from '@angular/router';
import { LoaderService } from './services/loader/loader.service';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from './header/header.component';
import { FooterComponent } from './footer/footer.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    MatProgressSpinner,
    CommonModule,
    HeaderComponent,
    FooterComponent,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  isLoading$;


  constructor(private loader: LoaderService, private router: Router) {
    this.isLoading$ = this.loader.isLoading;

  }
}
