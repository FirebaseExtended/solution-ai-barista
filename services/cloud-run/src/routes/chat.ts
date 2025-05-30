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

import { Request, Response } from 'express';
import { ParamsDictionary } from 'express-serve-static-core'; 
import { ChatMessageModel } from '@ai-barista/shared';
import { AgentSessionManager } from '../ai';
import { createChatErrorFromError, createErrorResponse, createErrorResponseFromChatError } from '../utils/utils';
import { getSessionLogger } from '../logging/logger';

const chat = async (req: Request<ParamsDictionary, unknown, ChatMessageModel>, res: Response) => {
    // Get the auth details for the current interaction.
    const auth = res.locals.auth;
    const agentSessionManager = new AgentSessionManager(auth);
    const logger = getSessionLogger(auth);

    logger.info(`Processing /chat request for user ${auth.uid}`);

    try {

        if (!auth) {
            logger.error('User authentication is missing.');
            res.status(500).send(createErrorResponse('Chat was not called from active session.'));
            return;
        }

        // Forward the mesage to the AI model.
        const output = await agentSessionManager.chat(req.body.text, req.body.media);
        res.status(200).send(output);
    } catch (error) {
        logger.error('Error processing /chat request:', error);
        const chatError = createChatErrorFromError(error);
        res.status(chatError.statusCode).send(createErrorResponseFromChatError(chatError));
    }
};

export default chat;