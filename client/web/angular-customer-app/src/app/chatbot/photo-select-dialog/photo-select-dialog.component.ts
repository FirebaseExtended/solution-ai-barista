import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import {
  MatDialogModule,
  MatDialogRef,
  MAT_DIALOG_DATA,
} from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';

export interface PhotoDialogData {
  photos: { url: string; alt: string }[];
}

@Component({
  selector: 'app-photo-selection-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  templateUrl: './photo-select-dialog.component.html',
  styleUrls: ['./photo-select-dialog.component.scss'],
})
export class PhotoSelectDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<PhotoSelectDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: PhotoDialogData
  ) {}

  onNoClick(): void {
    this.dialogRef.close();
  }

  selectPhoto(photo: { url: string; alt: string }): void {
    this.dialogRef.close(photo);
  }
}
