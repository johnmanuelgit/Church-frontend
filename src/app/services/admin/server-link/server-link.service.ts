import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ServerLinkService {
  constructor() {}

  server = 'https://church-backend-production.up.railway.app';
}
