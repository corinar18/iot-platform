import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { FacesComponent } from './faces.component';

describe('FacesComponent', () => {
  let component: FacesComponent;
  let fixture: ComponentFixture<FacesComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ FacesComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FacesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
