import { BeverageModel } from "../../../../../../../shared";

let agentState: AgentState = {
    suggestedResponses: [],
    inProgressOrder: [],
    orderSubmitted: false,
    readyForSubmission: false,
};

export const updateState = (state: {
    suggestedResponses: string[],
    inProgressOrder: BeverageModel[],
    orderSubmitted: boolean,
    readyForSubmission: boolean,
}) => {
    agentState = state;
}

export const getAgentState = () => {
    return agentState;
}

export interface AgentState {
    suggestedResponses: string[];
    inProgressOrder: BeverageModel[];
    orderSubmitted: boolean;
    readyForSubmission: boolean;
    // lastInterrupt?: ToolRequestPart
}