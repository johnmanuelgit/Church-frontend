import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChristmasTaxComponent } from './christmas-tax.component';

describe('ChristmasTaxComponent', () => {
  let component: ChristmasTaxComponent;
  let fixture: ComponentFixture<ChristmasTaxComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChristmasTaxComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ChristmasTaxComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
