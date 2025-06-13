import { Component, Inject } from '@angular/core';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import {
  ImageCroppedEvent,
  ImageCropperComponent,
} from 'ngx-image-cropper';

@Component({
  selector: 'app-coffee-select',
  imports: [MatDialogModule, MatButtonModule, ImageCropperComponent],
  templateUrl: './coffee-select.component.html',
  styleUrl: './coffee-select.component.scss',
})
export class CoffeeSelectComponent {
  croppedImage: any = '';

  constructor(
    public dialogRef: MatDialogRef<CoffeeSelectComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { image: string }
  ) {}

  onNoClick(): void {
    this.dialogRef.close();
  }

  imageCropped(event: ImageCroppedEvent) {
    this.croppedImage = event.blob;
  }
}
