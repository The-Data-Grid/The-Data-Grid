import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SelectorsTemplateComponent } from './selectors-template.component';

describe('SelectorsTemplateComponent', () => {
  let component: SelectorsTemplateComponent;
  let fixture: ComponentFixture<SelectorsTemplateComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SelectorsTemplateComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SelectorsTemplateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
