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

import { Injectable, inject } from '@angular/core';

import { ChatMessageModel } from '../../../../../../shared/chatMessageModel';
import { ChatResponseModel } from '../../../../../../shared/chatResponseModel';
import { OrderConfirmationMessage } from '../../../../../../shared/orderConfirmationMessage';

import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, catchError, from, map } from 'rxjs';
import { geminiModel } from '../../environments/environment';
import { LoginService } from './login.service';
import {
  AI,
  Content,
  GenerativeModel,
  getGenerativeModel,
  Part,
} from '@angular/fire/ai';
import { orderingAgentInfo } from './agents/orderingAgent/orderingAgent';
import {
  clearOrder,
  handleOrderingFunctionCall,
  orderingTool,
} from './agents/orderingAgent/orderTools';
import { getAgentState, updateState } from './state/agentState';
import { ChatHistory } from './state/chatHistory';
import { SubmittedOrderStore } from './stores/submittedOrderStore';
import { generateName } from './utils/submissionUtils';
import { Firestore, getFirestore } from '@angular/fire/firestore';
import { getMenuItemImage } from './utils/menuUtils';

// const chatUrl = `${environment.backendUrl}/chat`;
// const approveUrl = `${environment.backendUrl}/approveOrder`;

@Injectable({
  providedIn: 'root',
})
export class CoffeeService {
  private loginService: LoginService = inject(LoginService);
  private ai = inject(AI);
  private firestore = inject(Firestore);
  private generativeModel: GenerativeModel;
  private chatMessages = new ChatHistory();

  constructor() {
    // Initialize the generative model once
    this.generativeModel = getGenerativeModel(this.ai, {
      model: geminiModel,
      generationConfig: {
        temperature: orderingAgentInfo.config.temperature,
      },
      tools: [orderingTool],
    });
  }

  sendMessage(request: ChatMessageModel): Observable<ChatResponseModel> {
    const processRequest = async (): Promise<ChatResponseModel> => {
      const parts: Part[] = [{ text: request.text }];
      if (request.media?.base64Data && request.media.mimeType) {
        parts.push({
          inlineData: {
            data: request.media.base64Data,
            mimeType: request.media.mimeType,
          },
        });
      }

      const chatSession = this.generativeModel.startChat({
        systemInstruction: {
          role: 'system',
          parts: [{ text: orderingAgentInfo.prompt }],
        },
        history: this.chatMessages.getMessages(),
      });

      let generationResponse = await chatSession.sendMessage(parts);
      const MAX_TOOL_CALLING_STEPS = 5;
      let currentStep = 0;

      while (currentStep < MAX_TOOL_CALLING_STEPS) {
        const functionCalls = generationResponse.response.functionCalls();
        if (!functionCalls || functionCalls.length === 0) {
          break;
        }

        const functionResults: Part[] = [];
        let stopLoop = false;

        // Define which tools modify the order and should end the turn.
        const turnEndingTools = [
          'add_to_order',
          'remove_item',
          'update_item',
          'clear_order',
          'submit_order',
        ];

        for (const call of functionCalls) {
          const result = handleOrderingFunctionCall(call.name, call.args);
          if (turnEndingTools.includes(call.name)) {
            stopLoop = true;
          }

          functionResults.push({
            functionResponse: { name: call.name, response: result },
          });
        }

        generationResponse = await chatSession.sendMessage(functionResults);
        if (stopLoop || generationResponse.response.text()) {
          break;
        }

        currentStep++;
      }

      const agentCurrentState = getAgentState();
      const imageUrl = agentCurrentState.featuredItemName
        ? getMenuItemImage(agentCurrentState.featuredItemName)
        : undefined;

      const chatResponse: ChatResponseModel = {
        role: 'agent',
        text: generationResponse.response.text(),
        suggestedResponses: agentCurrentState.suggestedResponses || [],
        readyForSubmission: agentCurrentState.readyForSubmission || false,
        orderSubmitted: agentCurrentState.orderSubmitted || false,
        order: agentCurrentState.inProgressOrder || [],
        featuredItemImage: imageUrl,
      };

      updateState({
        ...getAgentState(),
        featuredItemName: null,
        suggestedResponses: [],
      });
      this.chatMessages.setMessages(await chatSession.getHistory());
      return chatResponse;
    };

    return from(processRequest()).pipe(
      catchError((error) => {
        console.error('An error occurred during the chat process:', error);
        updateState({
          ...getAgentState(),
          featuredItemName: null,
          suggestedResponses: [],
        });
        throw error.error || new Error('Failed to get a response from Gemini.');
      })
    );

    // const generationResponse = from(chatSession.sendMessage(parts));
    // return generationResponse.pipe(
    //   catchError((err) => {
    //     throw err.error;
    //   }),
    //   map((data) => {
    //     const functionCalls = data.response.functionCalls()
    //     if(functionCalls !== undefined) {
    //       const functionResults: {functionResponse: {name: string, response: any}}[] = [];
    //       for (const call of functionCalls) {
    //         const result = handleOrderingFunctionCall(call.name, call.args);
    //         functionResults.push({functionResponse: {name: call.name, response: JSON.stringify(result)}});
    //       }
    //       chatSession.sendMessage(functionResults).then((gcr) => {
    //         const chatResponse: ChatResponseModel = {
    //           role: 'agent',
    //           text: gcr.response.text(),
    //           suggestedResponses: getAgentState().suggestedResponses || [],
    //           readyForSubmission: getAgentState().readyForSubmission || false,
    //           orderSubmitted: getAgentState().orderSubmitted || false,
    //           order: getAgentState().inProgressOrder || []
    //         };
    //         return chatResponse;
    //       });
    //     }
    //     const chatResponse: ChatResponseModel = {
    //       role: 'agent',
    //       text: data.response.text(),
    //       suggestedResponses: getAgentState().suggestedResponses || [],
    //           readyForSubmission: getAgentState().readyForSubmission || false,
    //           orderSubmitted: getAgentState().orderSubmitted || false,
    //           order: getAgentState().inProgressOrder || []
    //         };
    //     return chatResponse;
    //   })
    // );

    // this.generativeModel.ch(parts).then((gcr) =>
    //   {
    //     gcr.response.text
    //   }
    // );

    // return this.http.post<ChatResponseModel>(chatUrl, request, this.getHttpOptions())
    // .pipe(
    //   catchError((err: HttpErrorResponse) => {
    //     // console.error(err);
    //     throw err.error;
    //   }),
    //   map((data: ChatResponseModel): ChatResponseModel => {
    //     return data;
    //   })
    // );
  }

  sendOrderApproval(
    request: OrderConfirmationMessage
  ): Observable<ChatResponseModel> {
    // const chatResponse: ChatResponseModel = {
    //   role: 'agent',
    //   text: "Order submitted",
    //   suggestedResponses: getAgentState().suggestedResponses || [],
    //   readyForSubmission: getAgentState().readyForSubmission || false,
    //   orderSubmitted: request.orderApproved,
    //   order: getAgentState().inProgressOrder || []
    // };
    if (!request.orderApproved) {
      return this.sendMessage({
        role: 'user',
        text: 'Actually, I need to make some changes to my order.',
      });
    }

    const submit = async (): Promise<ChatResponseModel> => {
      const orderToSubmit = getAgentState().inProgressOrder || [];
      if (orderToSubmit.length === 0) {
        return {
          role: 'agent',
          text: 'It looks like your order is empty! What can I get for you?',
          suggestedResponses: [],
          readyForSubmission: false,
          orderSubmitted: false,
          order: [],
        };
      }

      const orderName = generateName();
      const submittedOrderStore = new SubmittedOrderStore(
        this.loginService.idToken(),
        this.firestore
      );

      await submittedOrderStore.submitOrder(orderName, orderToSubmit);
      clearOrder();

      return {
        role: 'agent',
        text: `Excellent! Your order has been submitted as "${orderName}". We'll have it ready for you shortly.`,
        suggestedResponses: [],
        readyForSubmission: false,
        orderSubmitted: true,
        order: [], 
      };
    };

    return from(submit()).pipe(
      catchError((err) => {
        console.error('An error occurred during order submission:', err);
        throw err.error || new Error('Failed to submit the order.');
      })
    );
  }
}
