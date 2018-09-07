import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CollectHomeComponent } from './collect-home.component';

describe('CollectHomeComponent', () => {
  let component: CollectHomeComponent;
  let fixture: ComponentFixture<CollectHomeComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CollectHomeComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CollectHomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
