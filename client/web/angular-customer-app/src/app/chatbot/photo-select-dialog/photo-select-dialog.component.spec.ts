import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PhotoSelectDialogComponent } from './photo-select-dialog.component';

describe('PhotoSelectDialogComponent', () => {
  let component: PhotoSelectDialogComponent;
  let fixture: ComponentFixture<PhotoSelectDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PhotoSelectDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PhotoSelectDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
