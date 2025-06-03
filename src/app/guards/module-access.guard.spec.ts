import { TestBed } from '@angular/core/testing';
import { CanActivateFn } from '@angular/router';

import { moduleAccessGuard } from './module-access.guard';

describe('moduleAccessGuard', () => {
  const executeGuard: CanActivateFn = (...guardParameters) => 
      TestBed.runInInjectionContext(() => moduleAccessGuard(...guardParameters));

  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('should be created', () => {
    expect(executeGuard).toBeTruthy();
  });
});
