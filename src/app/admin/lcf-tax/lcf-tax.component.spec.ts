import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LcfTaxComponent } from './lcf-tax.component';

describe('LcfTaxComponent', () => {
  let component: LcfTaxComponent;
  let fixture: ComponentFixture<LcfTaxComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LcfTaxComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LcfTaxComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
