import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DatasetPositionsComponent } from './dataset-positions.component';

describe('DatasetPositionsComponent', () => {
  let component: DatasetPositionsComponent;
  let fixture: ComponentFixture<DatasetPositionsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DatasetPositionsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DatasetPositionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
