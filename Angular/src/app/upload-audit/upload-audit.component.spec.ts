import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { UploadAuditComponent } from './upload-audit.component';

describe('UploadAuditComponent', () => {
  let component: UploadAuditComponent;
  let fixture: ComponentFixture<UploadAuditComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ UploadAuditComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(UploadAuditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
