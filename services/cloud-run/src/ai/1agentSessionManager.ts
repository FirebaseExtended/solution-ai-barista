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

import { ai } from './genkit';
import { FirestoreSessionstore } from '../firestore/sessionStore';
import { getFirestore } from 'firebase-admin/firestore';
import { OrderingAgent } from './agents';
import { ChatResponse } from '../types/ChatResponse';
import { AgentState } from '../types/agentState';
import { Session } from '@genkit-ai/ai/session';
import { ChatOptions } from '@genkit-ai/ai/chat';
import { createChatErrorFromError } from '../utils/utils';
import { getSessionLogger } from '../logging/logger';
import { MediaModel } from 'libs/shared/chatMessageModel';
import { BeverageModel } from '@ai-barista/shared';
import { orderTools } from './agents/orderingAgent/orderTools';
import { Part } from 'genkit/beta';
import { DecodedIdToken } from 'firebase-admin/auth';
import { menuText } from './agents/utils/menuUtils';

/**
 * Manages user sessions for interacting with the AI ordering agent.
 * 
 * A session is identified by the user's uid. It is stored in a FirestoreSessionstore, 
 * identified by the user.
 */
export class AgentSessionManager {
    private db;
    private sessionStore;
    private auth;
    private session!: Session<AgentState>;
    private logger;

    /**
     * Creates a new AgentSessionManager instance for the given user.
     * @param auth The authentication details for the user.
     */
    constructor(auth: DecodedIdToken) {
        this.db = getFirestore();
        this.sessionStore = new FirestoreSessionstore<AgentState>(this.db);
        this.auth = auth;
        this.logger = getSessionLogger(this.auth);

    }

    /**
     * Resume an interrupted 'submitOrder' tool call with a user response.
     */
    async resumeOrderConfirmation(orderApproved: boolean) {
        const session = await this.getSession();
        const interrupt = session.state?.lastInterrupt

        // The only interrupt that is used by the agent is from tool 'submitOrder'.
        if (interrupt) {
            const confirmations = [orderTools.submitOrder.restart(interrupt, { approved: orderApproved })];
            return this.sendChat('', { resume: { restart: confirmations } })
        }

        // Send an empty message to continue the conversation if there's no interrupt to resume.
        return this.sendChat('');
    }

    /**
     * Send a chat message with an optional media item.
     */
    async chat(inputText: string, inputMedia: MediaModel | undefined): Promise<ChatResponse> {
        // Construct the message for the genkit chat session.
        const chatMessage: Part[] = [{ text: inputText }];
        if (inputMedia) {
            // Include the optional media field if a media item is supplied.
            chatMessage.push({ media: { url: inputMedia.storageUrl, contentType: inputMedia.contentType } });
        }
        return this.sendChat(chatMessage);
    }

    async sendChat(message: Part[] | string, chatOptions: ChatOptions<unknown> = {}): Promise<ChatResponse> {
        // Load the session from the store if a session ID exists, otherwise create a new session.
        const session = await this.getSession();

        // Include the user's auth details and the current menu in the context for the agent. 
        chatOptions = { ...chatOptions, context: { auth: this.auth, menu: menuText } };

        this.logger.info('Sending chat message.', message);

        // Set up the chat with the ordering agent and send the message.
        let response;
        const chat = this.session.chat(OrderingAgent, chatOptions);
        try {
            response = await chat.send(message);
        } catch (error) {
            this.logger.error('Error while receiving chat response.', error);
            throw createChatErrorFromError(error);
        }

        // If the chat was interrupted, user input or confirmation is required.
        if (response.finishReason === 'interrupted') {
            for (const interrupt of response.interrupts) {
                // Check all interrupts but only handle a single 'confirm_order' interrupt and ignore all others.
                if (interrupt.toolRequest.name === 'submit_order') {
                    // Store the interrupt in the session so that it can be resumed when the next request comes in.
                    await session.updateState({
                        ...session.state!,
                        lastInterrupt: interrupt
                    });
                    // Return a response to the user to confirm the order.
                    return new ChatResponse({
                        text: response.text || 'Can you confirm your order please?',
                        suggestedResponses: [],
                        readyForSubmission: true,
                        order: session.state?.inProgressOrder
                    });
                }
            }
        }


        // Return a standard ChatResponse if the call completed without interruption.
        const chatResponse = new ChatResponse({
            text: response.text,
            suggestedResponses: session.state?.suggestedResponses || [],
            orderSubmitted: session.state?.orderSubmitted,
            order: session.state?.inProgressOrder
        });
        this.logger.info('Returning response', chatResponse)
        return chatResponse;
    }

    /**
     * Clear the current session.
     * @returns True if the session was cleared successfully, false otherwise.
     */
    async clearSession(): Promise<boolean> {
        // Use the user's uid to identify the session.
        const sessionId = this.auth.uid;

        // Return if there is no session to clear for the user.
        if (await !this.sessionStore.has(sessionId)) {
            return true;
        }

        // Clear the session stored in the session store.
        await this.sessionStore.clear(sessionId);

        return true;
    }

    /**
     * 
     * @returns The current in-progress order for the user.
     */
    async getInProgressOrder(): Promise<BeverageModel[]> {
        const session = await this.getSession();
        return session.state?.inProgressOrder || [];
    }

    /**
     * Load or a create a new genkit session for the given session ID.
     * @param sessionID ID of the session to restore. If undefined, a new session is created.
     * @returns A session for this AI interaction.
     */
    private async getSession(): Promise<Session<AgentState>> {
        // If the session has already been loaded, return it. Otherwise initialize it.
        if (this.session) {
            return this.session;
        }

        // Use the user's uid to identify the session.
        const sessionId = this.auth.uid;

        const logger = getSessionLogger(this.auth);

        try {
            if (await this.sessionStore.has(sessionId)) {
                this.session = await ai.loadSession(sessionId, {
                    store: this.sessionStore,
                });

                // Reset state for properties that are only used in a single interaction if there is already a state set.
                if (this.session.state) {
                    this.session.updateState({
                        ...this.session.state,
                        suggestedResponses: [],
                        orderSubmitted: false,
                    });
                }
            } else {
                this.session = ai.createSession<AgentState>({
                    sessionId: sessionId,
                    store: this.sessionStore,
                    initialState: {
                        suggestedResponses: [],
                        orderSubmitted: false,
                        inProgressOrder: [],
                        lastInterrupt: undefined
                    }
                });
            }
        } catch (error) {
            logger.error('Error loading session:', error);
            // This could be a Firestore error or a genkit error.
            throw createChatErrorFromError(error);
        }
        return this.session;
    }
}
