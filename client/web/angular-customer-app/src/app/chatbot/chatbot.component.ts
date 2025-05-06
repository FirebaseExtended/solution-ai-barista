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


import { Component, effect, inject, signal } from '@angular/core';
import {
  FormControl,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { BeverageModel } from '../../../../../../shared/beverageModel';
import { MediaModel } from '../../../../../../shared/chatMessageModel';
import { ChatService } from '../services/chat.service';
import { MediaStorageService } from '../services/mediaStorage.service';
import { OrderDialog } from './order-dialog/order-dialog.component';

@Component({
  selector: 'app-chatbot',
  standalone: true,
  imports: [
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './chatbot.component.html',
  styleUrl: './chatbot.component.scss',
})
export class ChatbotComponent {
  chatService: ChatService = inject(ChatService)
  mediaStorageService: MediaStorageService = inject(MediaStorageService);
  dialog = inject(MatDialog)

  input = signal<string | undefined>(undefined);
  chatFormControl = new FormControl(
    'What is the recommended coffee of the day?',
    [Validators.required]
  );

  constructor() {
    effect(() => {
      if (this.chatService.readyForSubmission()) {
        // Display the order confirmation dialog if the order is ready for submission
        this.openOrderSubmissionDialog(this.chatService.order())
      } else if(this.chatService.orderSubmitted()){
        // Display a dialog with the final message from the agent if the order has been submitted.
        this.openFinalConfirmationDialog(this.chatService.history()[0].text)
      }
    });

    effect(() => {
      if (this.chatService.history().length === 0) {
        this.chatFormControl.setValue("What is the recommended coffee of the day?")
      }
    });

    effect(() => {
      if (this.chatService.loading()) {
        this.disableChat()
      } else {
        this.enableChat()
      }
    });
  }

  ask(message?: string, media?: MediaModel) {
    const text = message ?? this.chatFormControl.value!.trim()
    const photo = media ?? this.mediaStorageService.media() ?? undefined
    // if (!text) return;
    this.chatService.sendChat(text, photo)
  }

  keyPress(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      if (event.ctrlKey || event.shiftKey) {
        this.input.set(this.input() + '\n')
      } else {
        if (this.chatFormControl.invalid) return;
        this.ask(this.input());
      }
    }
  }

  setFileData(event: Event): void {
    const eventTarget: HTMLInputElement | null =
      event.target as HTMLInputElement | null;
      
    if (eventTarget?.files?.[0]) {      
      const file: File = eventTarget.files[0];
      const reader = new FileReader();
      reader.addEventListener('load', () => {        
        this.uploadPhoto(reader.result as string)
      });
      reader.readAsDataURL(file);
    }
  }

  uploadPhoto(file: string) {
    fetch(file)
      .then((response => response.blob()))
      .then((blob => {
        // Ensure the filename is unique, otherwise existing files will be overwritten.
        const fileName = `${Date.now()}.jpg`;
        const loadedFile = new File([blob], fileName, { type: "image/jpeg" });

        this.mediaStorageService.uploadMedia(loadedFile)
          .catch((error) => {
            console.error('Error uploading image', error);
          });
      }));
  }

  confirmOrder() {
    this.ask('I want to submit my order.');
  }

  private openFinalConfirmationDialog(message: string) {
    let dialogRef = this.dialog.open(OrderDialog, {
      data: {
        message: message,
        isConfirmation: true
      },
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(result => {
      this.chatService.clearSession();
    })
  }

  private openOrderSubmissionDialog(order: BeverageModel[]) {
    console.log("SUBMITTING READY!!!");
    let dialogRef = this.dialog.open(OrderDialog, {
      data: { order: order },
      disableClose: true
    });
    dialogRef.afterClosed().subscribe(result => {
      this.chatService.sendOrderConfirmation(result.submitOrder);
    });
  }

  private disableChat() {
    this.chatFormControl.setValue('')
    this.chatFormControl.disable()
    this.mediaStorageService.media.set(null)
  }

  private enableChat() {
    this.chatFormControl.enable()
    this.chatFormControl.markAsUntouched()
    this.chatFormControl.markAsPristine()
  }
}
