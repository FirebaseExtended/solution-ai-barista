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
import { AI, Content, getGenerativeModel, Part } from '@angular/fire/ai';
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
  private generativeModel = getGenerativeModel(this.ai, { model: geminiModel });
  private chatMessages = new ChatHistory();
  constructor() {}

  /**
   * Create Http options that include the latest id token.
   */
  // private getHttpOptions() {
  //   const idToken = this.loginService.idToken();
  //   const appCheckToken = this.loginService.appCheckToken();

  //   return {
  //     headers: new HttpHeaders({
  //       'X-Firebase-AppCheck': appCheckToken,
  //       'Authorization': `Bearer ${idToken}`,
  //       'Content-Type': 'application/json',
  //       'Access-Control-Allow-Origin': '*',
  //       Allow: '*'
  //     }),
  //     withCredentials: true
  //   };
  // }

  private async generateResponse(
    parts: Part[],
    currentStep: number = 0,
    maxGenSteps: number = 15
  ): Promise<any> {
    this.generativeModel.generationConfig = {
      ...this.generativeModel.generationConfig,
      temperature: orderingAgentInfo.config.temperature,
    };
    const chatSession = this.generativeModel.startChat({
      systemInstruction: {
        role: 'system',
        parts: [{ text: orderingAgentInfo.prompt }],
      } as Content,
      tools: [orderingTool],
      history: this.chatMessages.getMessages(),
    });

    let generationResponse = await chatSession.sendMessage(parts);
    const functionCalls = generationResponse.response.functionCalls();
    if (functionCalls !== undefined && functionCalls.length > 0) {
      const functionResults: {
        functionResponse: { name: string; response: any };
      }[] = [];
      let hasNonStateUpdatingCall = false;

      for (const call of functionCalls) {
        const result = handleOrderingFunctionCall(call.name, call.args);
        functionResults.push({
          functionResponse: { name: call.name, response: result },
        });
        if (call.name !== 'suggest_responses' && call.name !== 'feature_item') {
          hasNonStateUpdatingCall = true;
        }
      }
      if (currentStep < maxGenSteps) {
        return this.generateResponse(functionResults, currentStep + 1, maxGenSteps);
      }
    }
    return generationResponse;
  }

  sendMessage(request: ChatMessageModel): Observable<ChatResponseModel> {
    const parts: Array<Part> = new Array();
    parts.push({ text: request.text });
    if (request.media && request.media.downloadUrl) {
      const base64Parts = request.media.downloadUrl.split(',');
      if (base64Parts.length === 2) {
        parts.push({ inlineData: { data: base64Parts[1], mimeType: request.media.contentType } });
      } else {
        console.warn("Media downloadUrl doesn't seem to be a valid data URL:", request.media.downloadUrl);
      }
    }
    updateState({ ...getAgentState(), featuredItemName: null });

    this.generativeModel.generationConfig = {
      ...this.generativeModel.generationConfig,
      temperature: orderingAgentInfo.config.temperature,
    };

    const generationPromise = this.generateResponse(parts);
    return from(generationPromise).pipe(
      catchError((err) => {
        throw err.error;
      }),
      map((data) => {
        const agentCurrentState = getAgentState();
        let imageUrl: string | undefined = undefined;

        if (agentCurrentState.featuredItemName && getMenuItemImage(agentCurrentState.featuredItemName)) {
          imageUrl = getMenuItemImage(agentCurrentState.featuredItemName);
        }

        const chatResponse: ChatResponseModel = {
          role: 'agent',
          text: data.response.text(),
          suggestedResponses: getAgentState().suggestedResponses || [],
          readyForSubmission: getAgentState().readyForSubmission || false,
          orderSubmitted: getAgentState().orderSubmitted || false,
          order: getAgentState().inProgressOrder || [],
          featuredItemImage: imageUrl,
        };
        this.chatMessages.addMessage({ role: 'user', parts: parts });
        if (data.response) {
            this.chatMessages.addMessage(data.response.candidates[0].content); // Add model's response to history
        }
        return chatResponse;
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

    return from(
      new SubmittedOrderStore(
        this.loginService.idToken(),
        getFirestore()
      ).submitOrder(generateName(), getAgentState().inProgressOrder || [])
    ).pipe(
      catchError((err) => {
        throw err.error;
      }),
      map((data) => {
        const x: ChatResponseModel = {
          role: 'agent',
          text: `Order submitted as ${data}`,
          suggestedResponses: [],
          readyForSubmission: true,
          orderSubmitted: true,
          order: getAgentState().inProgressOrder || [],
          featuredItemImage: undefined
        };
        clearOrder();
        return x;
      })
    );

    // return from (new Promise<ChatResponseModel>((resolve, reject) => resolve(chatResponse))).pipe(
    //   catchError((err) => {
    //     throw err.error;
    //   }),
    //   map((data: ChatResponseModel): ChatResponseModel => {
    //     return data;
    //   })
    // );
  }
}
