import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ManagingUserLoginComponent } from './managing-user-login.component';

describe('ManagingUserLoginComponent', () => {
  let component: ManagingUserLoginComponent;
  let fixture: ComponentFixture<ManagingUserLoginComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ManagingUserLoginComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ManagingUserLoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
