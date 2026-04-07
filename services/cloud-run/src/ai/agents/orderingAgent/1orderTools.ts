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

import { ai } from '../../genkit';
import { z } from 'genkit';
import { AgentState } from '../../../types/agentState';
import logger from '../../../logging/logger';
import { BeverageModel } from 'libs/shared';
import { createBeverage } from '../../../utils/utils';
import { beverageToTuple, getStateOrder, updateStateOrder } from '../utils/agentUtils';
import { menuAllBeverages } from '../utils/menuUtils';
import ChatError from '../../../types/ChatError';
import { SubmittedOrderStore } from '../../../firestore/submittedOrderStore';
import { generateName } from '../../../utils/submissionUtils';

/**
 * Schema that describes beverages.
 * This enum contains the names of beverages used in the prompt.
 */
const beveragesEnum = z.enum([...menuAllBeverages] as [string, ...string[]]);

const addItem = ai.defineTool({
  name: 'add_to_order',
  description: 'Adds a drink to the customer\'s order with optional modifiers.',
  inputSchema: z.object({
    drink: beveragesEnum.describe('The name of the drink.'),
    modifiers: z.array(z.string()).optional().describe('An array of modifiers for the drink (optional).'),
  }),
  outputSchema: z.number().describe('The number of items currently in the order.'),
},
  async ({ drink, modifiers = [] }) => {
    const beverage = createBeverage(drink, modifiers);
    logger.info('[add_to_order]', { beverage: beverage });

    const order: BeverageModel[] = getStateOrder();
    const count = order.push(beverage);
    await updateStateOrder(order);
    return count;
  }
);

const updateItem = ai.defineTool({
  name: 'update_item',
  description: 'Updates an existing drink in the customer\'s order with new details and modifiers.',
  inputSchema: z.object({
    index: z.number().describe('The index of the item to update (zero-based).'),
    drink: beveragesEnum.describe('The name of the drink.'),
    modifiers: z.array(z.string()).optional().describe('An array of modifiers for the drink (optional).'),
  }),
  outputSchema: z.tuple([z.string(), z.array(z.string())]).describe('The item that was updated.')
},
  async ({ index, drink, modifiers = [] }) => {
    const newBeverage = createBeverage(drink, modifiers)
    logger.info('[update_item]', { index: index, beverage: newBeverage });

    const order = getStateOrder();
    order[index] = newBeverage;    
    await updateStateOrder(order);
    return beverageToTuple(newBeverage);
  }
);

const getOrder = ai.defineTool({
  name: 'get_order',
  description: 'Returns the customer\'s  order.',
  inputSchema: z.void(),
  outputSchema: z.array(z.tuple([z.string(), z.array(z.string())])),
},
  async () => {
    const order = getStateOrder();
    logger.info('[get_order]', { order: order });

    // Convert to tuple list
    return order.map(beverage => beverageToTuple(beverage));
  }
)

const removeItem = ai.defineTool({
  name: 'remove_item',
  description: 'Remove the nth (zero-based) item from the order.',
  inputSchema: z.object({
    index: z.number().describe('The index of the item to remove (zero-based).'),
  }),
  outputSchema: z.tuple([z.string(), z.array(z.string())]).describe('The item that was removed.'),
},
  async ({ index }) => {
    logger.info('[remove_item]', { index: index });

    const order = getStateOrder();
    const removedItem = order.splice(index, 1);
    await updateStateOrder(order);
    return beverageToTuple(removedItem[0]);
  }
);


const clearOrder = ai.defineTool({
  name: 'clear_order',
  description: 'Removes all items from the customer\'s order.',
  inputSchema: z.void(),
  outputSchema: z.boolean().describe('True if the order list is now empty.'),
},
  async () => {
    logger.info('[clear_order]');

    updateStateOrder([]);
    return getStateOrder().length < 1;
  }
);

const submitOrder = ai.defineTool({
  name: 'submit_order',
  description: 'Submit the order. The user is asked for approval first. If the user has changes this call will return \'MAKE_CHANGES\'. If the order has been submitted, it will return \'SUBMITTED\'.',
  inputSchema: z.void(),
  outputSchema: z.object({
    status: z.string().describe('ORDER_SUBMITTED if the order has been submitted. MAKE_CHANGES if the user wants to make changes to the order.'),
    collectionName: z.string().optional().describe('The name under which the order can be collected.')
  }),
}, async (input, { context, interrupt, resumed }) => {
  logger.info('[submitOrder] Tool called.', { resumed: resumed });
  if (!resumed) {
    // The call has not been resumed and this is the first execution.
    logger.info('Interrupting execution to get user feedback');
    // Interrupt execution and provide the current order to the user.
    interrupt({ order: getStateOrder() });
  }

  logger.info('[submitOrder] Execution was resumed.', { resumed: resumed });

  // Submit the order if execution has resumed and the user has approved the order.
  if (resumed && typeof resumed === 'object' && resumed?.approved) {
    logger.info('[submitOrder] User has approved the order.');
    const order = await getStateOrder();
    if (order.length < 1) {
      throw new ChatError(500, 'Order is empty');
    }
    // Generate a name for this order
    const orderName = generateName();

    // Verify that there's an authenticated user in the context.
    if (!context.auth?.uid) {
      throw new ChatError(401, 'User not authenticated');
    }

    // Submit the order and store it under the current user.
    const submittedOrderStore = new SubmittedOrderStore(context.auth.uid);

    const submittedOrderId = await submittedOrderStore.submitOrder(orderName, order)
    if (!submittedOrderId) {
      logger.error('[submitOrder] Order submission failed.');
      throw new ChatError(500, 'Order could not be submitted.');
    }
    logger.info('[submitOrder] Order successfully submitted.', { orderId: submittedOrderId })

    // Flip the orderSubmitted field to notify clients.
    ai.currentSession<AgentState>().updateState({
      ...ai.currentSession().state,
      orderSubmitted: true
    });

    return { status: 'ORDER_SUBMITTED', collectionName: orderName };
  
  } else {
    // User has not approved the order.

    logger.info('[submitOrder] User has not approved the order.');
    return { status: 'MAKE_CHANGES' };
  }
});

const suggestedResponses = ai.defineTool({
  name: 'suggest_responses',
  description: 'A list of possible responses to suggest to the user. These are shown on screen and the user can reply with them in the next chat message.',
  inputSchema:
    z.object({
      responses: z.array(z.string()).describe('List of replies to show to the user. At most 3 replies can be shown. They should be short and concise. Can be empty.'),
    }),
  outputSchema: z.number().describe('The maxinum number of responses that will be shown.'),
},
  async ({ responses }: { responses: string[] }) => {
    logger.info('[suggest_responses]', { responses: responses });

    // Save the suggested respones in the current session.
    ai.currentSession<AgentState>().updateState({
      ...ai.currentSession().state,
      suggestedResponses: responses
    });
    return 4;
  }
)

export const orderTools = {
  addItem,
  updateItem,
  getOrder,
  removeItem,
  clearOrder,
  submitOrder,
  suggestedResponses
};
