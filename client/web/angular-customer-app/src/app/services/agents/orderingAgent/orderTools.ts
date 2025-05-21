import { FunctionDeclarationsTool, ObjectSchema, Schema, SchemaType } from '@angular/fire/ai';
import { BeverageModel } from '../../../../../../../../shared';
import { getAgentState, updateState } from '../../state/agentState';
import { beverageToTuple, getStateOrder, updateStateOrder } from '../../utils/agentUtils';
import { menuAllBeverages } from '../../utils/menuUtils';
import { getBaristaRecommendation } from '../recommendationAgent/recommendationTools';
import { SubmittedOrderStore } from '../../stores/submittedOrderStore';
// import { generateName } from '../../utils/submissionUtils';

/**
 * Creates a BeverageModel object with the given drink name and optional modifiers.
 */
export function createBeverage(drink: string, modifiers: string[] = []): BeverageModel {
    return { name: drink, modifiers: modifiers };
  }

export const addToOrder = (drink: string, modifiers: string[]) => {
    const beverage = createBeverage(drink, modifiers);
    console.info('[add_to_order]', {beverage: beverage});

    const order: BeverageModel[] = getStateOrder();
    const count = order.push(beverage);
    updateStateOrder(order);
    return getAgentState();;
}

export const updateItem = (index: number, drink: any, modifers: string[]) => {
    const newBeverage = createBeverage(drink, modifers);
    console.info('[update_item]', { index: index, beverage: newBeverage });

    const order = getStateOrder();
    order[index] = newBeverage;
    updateStateOrder(order);
    return {updatedBeverage: beverageToTuple(newBeverage)};
}

export const getOrder = () => {
    const order = getStateOrder();
    console.info('[get_order]', { order: order });

    // Convert to tuple list
    order.map(beverage => beverageToTuple(beverage));
    return getAgentState();
}

export const removeItem = (index: number) => {
    console.info('[remove_item]', { index: index });

    const order = getStateOrder();
    const removedItem = order.splice(index, 1);
    updateStateOrder(order);
    beverageToTuple(removedItem[0]);
    return getAgentState();
}

export const clearOrder = () => {
    console.info('[clear_order]');

    updateStateOrder([]);
    getStateOrder().length < 1;
    return getAgentState();
}

// TODO(@nohe427 / @kroikie / someone else?): This was designed for interrupts. We should maybe make this a button instead of a chat interaction to confirm submitting.
export const submitOrder = (readyForSubmission: boolean) => {
    if(readyForSubmission) {
        updateState({...getAgentState(), readyForSubmission: readyForSubmission});
    }
    // console.info('[submitOrder] Tool called.', { resumed: resumed });
    // if (!resumed) {
    //   // The call has not been resumed and this is the first execution.
    //   console.info('Interrupting execution to get user feedback');
    //   // Interrupt execution and provide the current order to the user.
    //   interrupt({ order: getStateOrder() });
    // }
  
    // console.info('[submitOrder] Execution was resumed.', { resumed: resumed });
  
    // // Submit the order if execution has resumed and the user has approved the order.
    // if (resumed && typeof resumed === 'object' && resumed?.approved) {
    //   console.info('[submitOrder] User has approved the order.');
    //   const order = getStateOrder();
    //   if (order.length < 1) {
    //     throw new Error('Order is empty');
    //   }
    //   // Generate a name for this order
    //   const orderName = generateName();
  
    //   // Verify that there's an authenticated user in the context.
    //   if (!context.auth?.uid) {
    //     throw new Error('User not authenticated');
    //   }
  
    //   // Submit the order and store it under the current user.
    //   const submittedOrderStore = new SubmittedOrderStore(context.auth.uid);
  
    //   const submittedOrderId = await submittedOrderStore.submitOrder(orderName, order)
    //   if (!submittedOrderId) {
    //     console.error('[submitOrder] Order submission failed.');
    //     throw new Error('Order could not be submitted.');
    //   }
    //   console.info('[submitOrder] Order successfully submitted.', { orderId: submittedOrderId })
  
    //   // Flip the orderSubmitted field to notify clients.
    //   updateState({
    //     ...getAgentState(),
    //     orderSubmitted: true
    //   });
  
    //   return { status: 'ORDER_SUBMITTED', name: orderName };
    
    // } else {
    //   // User has not approved the order.
  
    //   console.info('[submitOrder] User has not approved the order.');
    //   return { status: 'MAKE_CHANGES' };
    // }
    return getAgentState();
}

export const suggestResponses = (responses: string[]) => {
    console.info('[suggest_responses]', { responses: responses });

    const state = getAgentState();
    // Save the suggested respones in the current session.
    updateState({...state, suggestedResponses: responses})
    return {responsesSet: true};
}

export const featureItem = (itemName: string) => {
    console.info('[feature_item]', { itemName });
    if (menuAllBeverages.includes(itemName)) {
      updateState({ ...getAgentState(), featuredItemName: itemName });
      return { itemFeatured: itemName, success: true };
    }
    return { itemFeatured: null, success: false, error: "Item not found in menu." };
  };

export const orderingTool: FunctionDeclarationsTool = {
    functionDeclarations: [
        {
            name: 'add_to_order',
            description: 'Adds a drink to the customer\'s order with optional modifiers.',
            parameters: {
                type: SchemaType.OBJECT,
                properties: {
                    drink: Schema.enumString({
                        enum:menuAllBeverages, description:
                        'The name of the drink.'
                    }),
                    modifiers: Schema.array({
                        items: Schema.string({nullable: true}),
                        description: 'An array of modifiers for the drink (optional).'
                    }),
                },
            }
        },
        {
            name: 'update_item',
            description: 'Updates an existing drink in the customer\'s order with new details and modifiers.',
            parameters: {
                type: SchemaType.OBJECT,
                properties: {
                    index: Schema.number({
                        description: 'The index of the item to update (zero-based).'
                    }),
                    drink: Schema.enumString({
                        enum: menuAllBeverages,
                        description: 'The name of the drink.'
                    }),
                    modifiers: Schema.array({
                        items: Schema.string({nullable: true}),
                        description: 'An array of modifiers for the drink (optional).'
                    }),
                }
            }
        },
        {
            name: 'get_order',
            description: 'Returns the customer\'s  order.',
        },
        {
            name: 'add_to_order',
            description: 'Adds a drink to the customer\'s order with optional modifiers.',
            parameters: {
                type: SchemaType.OBJECT,
                properties: {
                    drink: Schema.enumString({
                        enum:menuAllBeverages, description:
                        'The name of the drink.'
                    }),
                    modifiers: Schema.array({
                        items: Schema.string({nullable: true}),
                        description: 'An array of modifiers for the drink (optional).'
                    }),
                }
            }
        },
        {
            name: 'remove_item',
            description: 'Remove the nth (zero-based) item from the order.',
            parameters: {
                type: SchemaType.OBJECT,
                properties: {
                    index: Schema.string({
                        description: 'The index of the item to remove (zero-based).'
                    }),
                }
            }
        },
        {
            name: 'clear_order',
            description: 'Removes all items from the customer\'s order.',
        },
        {
            name: 'submit_order',
            description: 'Submit the order. The user is asked for approval first. If the user has changes this call will return \'MAKE_CHANGES\'. If the order has been submitted, it will return \'SUBMITTED\'.',
            parameters: {
                type: SchemaType.OBJECT,
                properties: {
                    readyForSubmission: Schema.boolean({
                        description: 'Is the order ready for submission?'
                    }),
                }
            }
        },
        {
            name: 'suggest_responses',
            description: 'A list of possible responses to suggest to the user. These are shown on screen and the user can reply with them in the next chat message.',
            parameters: {
                type: SchemaType.OBJECT,
                properties: {
                    responses: Schema.array({
                        items: Schema.string(),
                        description: "List of replies to show to the user. At most 3 replies can be shown. They should be short and concise. Can be empty."
                    }),
                }
            }
        },
        {
            name: 'recommendation_agent',
            description: 'A way for the barista agent to recommend drinks to the user.',
        },
        {
            name: 'feature_item',
            description: 'Use this function to highlight a specific menu item when you are describing it or making a singular recommendation. This will allow an image of the item to be shown to the customer alongside your text. Call this function *before* calling `suggest_responses`. Only call this for a single item you are focusing on in your response.',
            parameters: {
              type: SchemaType.OBJECT,
              properties: {
                itemName: Schema.enumString({
                  enum: menuAllBeverages,
                  description: 'The exact name of the menu item to feature from the menu.'
                }),
              }
            }
        }
    ]
}

export function handleOrderingFunctionCall(callName: string, callArgs: any) {
    switch (callName) {
        case 'add_to_order':
            return addToOrder(callArgs.drink, callArgs.modifiers);
        case 'update_item':
            return updateItem(callArgs.index, callArgs.drink, callArgs.modifiers);
        case 'get_order':
            return getOrder();
        case 'add_to_oder':
            return addToOrder(callArgs.drink, callArgs.modifiers);
        case 'remove_item':
            return removeItem(callArgs.index);
        case 'clear_order':
            return clearOrder();
        case 'submit_order':
            return submitOrder(callArgs.readyForSubmission);
        case 'suggest_responses':
            return suggestResponses(callArgs.responses);
        case 'recommendation_agent':
            return getBaristaRecommendation();
        case 'feature_item':
            return featureItem(callArgs.itemName);
        default:
            throw new Error(`Unknown function call: ${callName}`);
    }
}