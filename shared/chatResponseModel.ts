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

import { BeverageModel } from "./beverageModel";

/**
 * Response from a chat agent interaction.
 */
export interface ChatResponseModel {
  /**
   * Role of the message (agent or user)
   */
  role: 'agent';

  /**
   * Main message content of the response.
   */
  text: string;

  /**
   * Array of suggested responses for the user to choose from.
   */
  suggestedResponses: string[];

  /**
   * True when the order is ready for user confirmation.
   */
  readyForSubmission: boolean;

  /**
   * True when the order has been submitted.
   */
  orderSubmitted: boolean;

  /**
   * The order for user confirmation. An order consists of one or more beverages.
   */
  order: BeverageModel[];

  /**
   * The image url of the current inquired or recommended item.
   */
  featuredItemImage?: string;
}
