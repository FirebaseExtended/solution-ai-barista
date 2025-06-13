/**
 * Copyright 2025 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { Injectable, inject, signal } from '@angular/core';

import {
  Storage,
  getDownloadURL,
  ref,
  uploadBytes,
} from '@angular/fire/storage';
import { MediaModel } from '../../../../../../shared/chatMessageModel';
import { LoginService } from './login.service';

@Injectable({
  providedIn: 'root',
})
export class MediaStorageService {
  private loginService: LoginService = inject(LoginService);
  private storage = inject(Storage);
  media = signal<MediaModel | null>(null);

  async processMedia(file: File): Promise<void> {
    try {
      const base64EncodedData = await this.fileToBase64(file);
      this.media.set({
        base64Data: base64EncodedData,
        mimeType: file.type,
      });
    } catch (error) {
      console.error('Error processing file to base64:', error);
      this.media.set(null);
      throw error;
    }
  }

  private fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (reader.result) {
          resolve((reader.result as string).split(',')[1]);
        } else {
          reject(new Error('FileReader result is null'));
        }
      };
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
    });
  }

  processDataUri(dataUri: string): void {
    try {
      const match = dataUri.match(/^data:(.+);base64,(.+)$/);

      if (!match) {
        throw new Error('Invalid data URI format provided.');
      }

      const mimeType = match[1];
      const base64Data = match[2];

      this.media.set({ base64Data, mimeType });
      console.log('Image from data URI processed and stored for the next message.');

    } catch (error) {
      console.error('Error processing data URI:', error);
      this.clearMedia();
    }
  }

  clearMedia(): void {
    this.media.set(null);
  }
}
