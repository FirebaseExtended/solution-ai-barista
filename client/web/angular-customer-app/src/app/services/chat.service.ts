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

import { BeverageModel } from '../../../../../../shared/beverageModel';
import { ChatMessageModel, MediaModel } from '../../../../../../shared/chatMessageModel';
import { ChatResponseModel } from '../../../../../../shared/chatResponseModel';
import { ErrorResponse } from '../../../../../../shared/errorResponse';
import { OrderConfirmationMessage } from '../../../../../../shared/orderConfirmationMessage';
import { CoffeeService } from './coffee.service';
import { LoginService } from './login.service';

@Injectable({
  providedIn: 'root',
})
export class ChatService {
  loading = signal<boolean>(false);
  history = signal<(ChatMessageModel | ChatResponseModel)[]>([]);
  suggestedResponses = signal<string[]>([]);
  error = signal<ErrorResponse | null>(null);
  readyForSubmission = signal<boolean>(false);
  orderSubmitted = signal<boolean>(false);
  order = signal<BeverageModel[]>([]);

  private coffeeService: CoffeeService = inject(CoffeeService);
  private loginService: LoginService = inject(LoginService);

  private processChatResponse(res: ChatResponseModel) {
    console.log('processing chat response', res);
    this.addToChatHistory(res);
    this.readyForSubmission.set(res.readyForSubmission);
    this.orderSubmitted.set(res.orderSubmitted);
    this.order.set(res.order ? [...res.order] : []);

    // Limit to a maximum of 4 suggested responses
    this.suggestedResponses.set(res.suggestedResponses.slice(0, 4)); 
  }

  private processError(err: ErrorResponse) {
    this.error.set(err);
    console.error(err)
    this.loading.set(false)
  }

  private processComplete() {
    this.error.set(null);
    this.loading.set(false);
  }

  addToChatHistory(chat: ChatMessageModel | ChatResponseModel){    
    if(chat.text !== "") {
      this.history.update((history) => [chat, ...history]);
      return;
    }
    if(chat.role == "agent") {
      if (chat.readyForSubmission) {
        return;
      }
    }
    this.history.update((history) => [{role:'user', text: 'Whoops, try again'}, ...history]);
  }

  sendOrderConfirmation(approved: boolean){
    this.loading.set(true)

    let message: OrderConfirmationMessage = {
      orderApproved: approved
    }

    this.coffeeService.sendOrderApproval(message)
    .subscribe({
      next: (res: ChatResponseModel) => this.processChatResponse(res),
      error: (err: ErrorResponse) => this.processError(err),
      complete: () => this.processComplete()
    });
  }

  sendChat(message: string, media?: MediaModel) {
    this.loading.set(true)

    let chat: ChatMessageModel = {
      role: 'user',
      text: message,
      media: media ?? undefined,
    }

    this.addToChatHistory(chat);
    this.suggestedResponses.set([])
console.log(chat,"ddd");
    this.coffeeService.sendMessage(chat)
    .subscribe({
      next: (res: ChatResponseModel) => this.processChatResponse(res),
      error: (err: ErrorResponse) => this.processError(err),
      complete: () => this.processComplete()
    });
  }

  clearChat(){
    this.orderSubmitted.set(false);
    this.readyForSubmission.set(false);
    this.history.set([]);
    this.suggestedResponses.set([]);
    this.error.set(null);
  }

  clearSession() {
    this.loading.set(true)

    this.loginService.clearSession().subscribe({
        error: (err: ErrorResponse) => this.processError(err),
        complete: () => {
          this.clearChat()
          this.processComplete()
        }
    })
  }
}
