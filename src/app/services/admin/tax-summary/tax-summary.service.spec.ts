import { TestBed } from '@angular/core/testing';

import { TaxSummaryService } from './tax-summary.service';

describe('TaxSummaryService', () => {
  let service: TaxSummaryService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TaxSummaryService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
