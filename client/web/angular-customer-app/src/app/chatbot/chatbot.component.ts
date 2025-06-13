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


import { Component, effect, inject, signal, WritableSignal } from '@angular/core';
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
import { MatExpansionModule } from '@angular/material/expansion';
import { BeverageModel } from '../../../../../../shared/beverageModel';
import { MediaModel } from '../../../../../../shared/chatMessageModel';
import { ChatService } from '../services/chat.service';
import { MediaStorageService } from '../services/mediaStorage.service';
import { OrderDialog } from './order-dialog/order-dialog.component';
import { getOrder } from '../services/agents/orderingAgent/orderTools';
import { PhotoSelectDialogComponent } from './photo-select-dialog/photo-select-dialog.component';
import { promptImages } from '../services/utils/menuUtils';

@Component({
  selector: 'app-chatbot',
  standalone: true,
  imports: [
    FormsModule,
    MatFormFieldModule,
    MatExpansionModule,
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
  currentOrder: WritableSignal<string> = signal("No items in your order yet.");

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
        // this.chatFormControl.setValue("What is the recommended coffee of the day?")
        // this.ask(this.input());
        this.openPhotoSelectionDialog()
      }
    });

    effect(() => {
      if (this.chatService.loading()) {
        this.disableChat()
      } else {
        this.enableChat()
      }
    });
    effect(() => {
      const orderItems: BeverageModel[] = this.chatService.order();
      if (orderItems && orderItems.length > 0) {
        this.currentOrder.set(
          orderItems
            .map(item => {
              let display = item.name;
              if (item.modifiers && item.modifiers.length > 0) {
                display += ` (${item.modifiers.join(', ')})`;
              }
              return display;
            })
            .join(`, \n`)
        );
      } else {
        this.currentOrder.set("No items in your order yet.");
      }
    });
  }

  ask(message?: string, media?: MediaModel) {
    const text = message ?? this.chatFormControl.value!.trim()
    const photo = media ?? this.mediaStorageService.media() ?? undefined
    // if (!text) return;
    this.chatService.sendChat(text, photo)
    this.chatFormControl.setValue('');
    this.mediaStorageService.clearMedia();
  }

  keyPress(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      if (event.ctrlKey || event.shiftKey) {
        this.input.set(this.input() + '\n')
      } else {
        event.preventDefault();
        if (this.chatFormControl.invalid) return;
        this.ask(this.input());
      }
    }
  }

  // setFileData(event: Event): void {
  //   const eventTarget: HTMLInputElement | null =
  //     event.target as HTMLInputElement | null;

  //   if (eventTarget?.files?.[0]) {
  //     const file: File = eventTarget.files[0];
  //     this.mediaStorageService.processMedia(file)
  //       .then(() => {
  //         console.log('File processed and will be sent with the next message.');
  //       })
  //       .catch((error) => {
  //         console.error('Error processing file for chat:', error);
  //       });
  //     if (eventTarget) {
  //       eventTarget.value = '';
  //     }
  //   }
  // }

  openPhotoSelectionDialog(): void {
    const weatherKeys = ['Snowy', 'Rainy'];
    const photosForDialog = [...promptImages].map(([name, dataUri]) => ({
      alt: name, 
      url: dataUri 
    }));

    const dialogRef = this.dialog.open(PhotoSelectDialogComponent, {
      width: 'clamp(300px, 80vw, 500px)',
      data: {
        photos: photosForDialog
      }
    });

    dialogRef.afterClosed().subscribe((result: { url: string; alt: string } | undefined) => {
      if (result && result.url && result.alt) {
        this.mediaStorageService.processDataUri(result.url);
        let promptText: string;

        if (weatherKeys.includes(result.alt)) {
          promptText = 'What would you recommend in this weather?';
        } else {
          promptText = 'What do you recommend for this occasion?';
        }
        this.chatFormControl.setValue(promptText);
      }
    });
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
    this.mediaStorageService.clearMedia()
  }

  private enableChat() {
    this.chatFormControl.enable()
    this.chatFormControl.markAsUntouched()
    this.chatFormControl.markAsPristine()
  }
}
