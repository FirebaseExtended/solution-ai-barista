import { BeverageModel } from '../../../../../../../shared';

let agentState: AgentState = {
  suggestedResponses: [],
  inProgressOrder: [],
  orderSubmitted: false,
  readyForSubmission: false,
  featuredItemName: null,
};

export const updateState = (state: Partial<AgentState>) => {
  agentState = { ...agentState, ...state };
};

export const getAgentState = () => {
  return agentState;
};

export const clearLastImageItem = () => {
  agentState = { ...agentState, featuredItemName: null };
};

export interface AgentState {
  suggestedResponses: string[];
  inProgressOrder: BeverageModel[];
  orderSubmitted: boolean;
  readyForSubmission: boolean;
  // lastInterrupt?: ToolRequestPart
  featuredItemName?: string | null;
}
