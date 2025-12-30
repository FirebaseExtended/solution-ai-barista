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

import ChatError from '../types/ChatError';
import { BeverageModel, ErrorResponse } from '@ai-barista/shared';
import { TextResponse } from '@ai-barista/shared';
import { UserFacingError } from 'genkit';

/**
 * Creates an ErrorResponse object with the given error message and a 500 error code.
 * @param errorMessage - The error message to include in the response.
 * @returns An ErrorResponse object.
 */
export function createErrorResponse(errorMessage: string, statusCode: number = 500): ErrorResponse {
  return {
    text: errorMessage,
    statusCode: statusCode,
  };
}

/**
 * Creates an ErrorResponse object from a ChatError. Includes its message and status code.
 * @param error 
 * @returns An ErrorResponse object.
 */
export function createErrorResponseFromChatError(error: ChatError): ErrorResponse {
  return {
    text: error.message,
    statusCode: error.statusCode,
  };
}

/**
 * Creates an ErrorResponse object from a ChatError. Includes its message and status code.
 * @param error 
 * @returns An ErrorResponse object.
 */
export function createErrorResponseFromMessageChatError(message: string, error: ChatError): ErrorResponse {
  return {
    text: `${message}: ${error.message}`,
    statusCode: error.statusCode,
  };
}


/**
 * Creates a TextResponse object with the given text message.
 * @param textMessage - The text message to include in the response.
 * @returns A TextResponse object.
 */
export function createTextResponse(textMessage: string): TextResponse {
  return {
    text: textMessage,
  };
}

/**
 * Convert any input to a ChatError.
 * If an enclosed error is of a type that contains a status code, it is also extracted.
 */
export function createChatErrorFromError(error: any): ChatError {

  if (error instanceof ChatError) {
    return error;
  }

  if (error instanceof UserFacingError) {
    return new ChatError(error.code, error.message, error);
  }

  if (error.stackTrace && error.stackTrace.message) {
    // A (client) error with a stacktrace and message has more information than a general error.
    const statusCode = error.stackTrace.code || 500;
    return new ChatError(statusCode, error.stackTrace.message, error);
  }

  if (error instanceof Error) {
    return new ChatError(500, error.message, error);
  }

  // Fallback to return a generic error.
  return new ChatError(500, 'An error occured', error);

}

/**
 * Creates a BeverageModel object with the given drink name and optional modifiers.
 */
export function createBeverage(drink: string, modifiers: string[] = []): BeverageModel {
  return { name: drink, modifiers: modifiers };
}
