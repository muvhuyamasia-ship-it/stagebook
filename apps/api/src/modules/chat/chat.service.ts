import { v4 as uuid } from "uuid";
import type { ChatMessage, UserRole } from "@stagebook/shared";
import { store } from "../../lib/inMemoryStore";

export class ChatService {
  list(bookingId: string) {
    return store.chatMessages.filter((message) => message.bookingId === bookingId);
  }

  send(input: {
    bookingId: string;
    senderUserId: string;
    senderRole: UserRole;
    body: string;
    systemAction?: ChatMessage["systemAction"];
  }) {
    const message: ChatMessage = {
      id: uuid(),
      bookingId: input.bookingId,
      senderUserId: input.senderUserId,
      senderRole: input.senderRole,
      body: input.body,
      systemAction: input.systemAction,
      createdAt: new Date().toISOString()
    };
    store.chatMessages.push(message);
    return message;
  }
}

export const chatService = new ChatService();
