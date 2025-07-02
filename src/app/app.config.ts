import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';

import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { httpInterceptor } from './interceptor/http-interceptor/http-interceptor.interceptor';
import { loaderInterceptorInterceptor } from './interceptor/loader-interceptor/loader-interceptor.interceptor';


export const appConfig: ApplicationConfig = {
  providers: [provideZoneChangeDetection({ eventCoalescing: true }), 
    provideRouter(routes),
    provideClientHydration(withEventReplay()),
    provideHttpClient(withFetch(),
   withInterceptors([httpInterceptor,loaderInterceptorInterceptor]))
  ]

};
