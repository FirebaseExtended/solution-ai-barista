import { BeverageModel } from "../../../../../../../shared";
import { getAgentState, updateState } from "../state/agentState";

/** 
 * Converts a BeverageModel to a tuple for use by tools.
 */
export function beverageToTuple(beverage: BeverageModel): [string, string[]] {
    return [beverage.name, beverage.modifiers];
  }

  /**
   * Saves the given order in the current session.
   * @param order Order to save in the current session
   */
  export async function updateStateOrder(order: BeverageModel[]) {
    const state = getAgentState();
    updateState({...state, inProgressOrder: order});
    // await ai.currentSession<AgentState>().updateState({
    //   ...ai.currentSession().state,
    //   inProgressOrder: order
    // });
  
    console.info('[updateStateOrder]', { newOrder: order });
  
  }

  /**
   * Retrieves the current order from the current session.
   * @returns The current order
   */
  export function getStateOrder(): BeverageModel[] {
    console.info('[getStateOrder]', { order: getAgentState().inProgressOrder });
    // return ai.currentSession<AgentState>().state?.inProgressOrder || [];
    const state = getAgentState().inProgressOrder || [];
    return state;
  }