import { Component } from '@angular/core';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { RouterOutlet } from '@angular/router';
import { LoaderService } from './services/loader/loader.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone:true,
  imports: [RouterOutlet,MatProgressSpinner,CommonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
    isLoading$;

constructor(private loader:LoaderService){this.isLoading$ = this.loader.isLoading;
}
  

}
