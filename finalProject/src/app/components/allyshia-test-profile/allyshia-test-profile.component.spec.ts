import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AllyshiaTestProfileComponent } from './allyshia-test-profile.component';

describe('AllyshiaTestProfileComponent', () => {
  let component: AllyshiaTestProfileComponent;
  let fixture: ComponentFixture<AllyshiaTestProfileComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [AllyshiaTestProfileComponent]
    });
    fixture = TestBed.createComponent(AllyshiaTestProfileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
