import { Content } from "@angular/fire/vertexai";

export class ChatHistory {
    messages: Content[];
    constructor() {
        this.messages = [];
    }

    addMessage(part: Content[]) {
        this.messages.push(...part);
    }

    getMessages(): Content[] {
        return this.messages;
    }
}