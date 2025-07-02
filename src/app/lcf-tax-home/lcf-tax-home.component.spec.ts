import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LcfTaxHomeComponent } from './lcf-tax-home.component';

describe('LcfTaxHomeComponent', () => {
  let component: LcfTaxHomeComponent;
  let fixture: ComponentFixture<LcfTaxHomeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LcfTaxHomeComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LcfTaxHomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
