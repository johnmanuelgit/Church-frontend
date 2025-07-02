import { ComponentFixture, TestBed } from '@angular/core/testing';

import { XmasTaxHomeComponent } from './xmas-tax-home.component';

describe('XmasTaxHomeComponent', () => {
  let component: XmasTaxHomeComponent;
  let fixture: ComponentFixture<XmasTaxHomeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [XmasTaxHomeComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(XmasTaxHomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
