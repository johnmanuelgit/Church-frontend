import { TestBed } from '@angular/core/testing';

import { ChristmasTaxService } from './christmas-tax.service';

describe('ChristmasTaxService', () => {
  let service: ChristmasTaxService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ChristmasTaxService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
