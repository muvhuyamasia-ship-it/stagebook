import { v4 as uuid } from "uuid";
import { AppError } from "../../lib/errors";
import { store } from "../../lib/inMemoryStore";

type ReplyChannel = "email" | "chat";
type ThreadStatus = "open" | "replied" | "closed";

interface ContactThreadInput {
  userId?: string;
  name: string;
  email: string;
  company?: string;
  subject: string;
  message: string;
  serviceInterest?: string;
  preferredReplyChannel?: ReplyChannel;
}

interface AdminReplyInput {
  adminUserId: string;
  body: string;
  channel: ReplyChannel;
}

interface ContactMessage {
  id: string;
  threadId: string;
  senderType: "client" | "admin";
  senderUserId?: string;
  senderName: string;
  body: string;
  channel: ReplyChannel;
  createdAt: string;
}

interface ContactThread {
  id: string;
  userId?: string;
  name: string;
  email: string;
  company?: string;
  subject: string;
  serviceInterest?: string;
  preferredReplyChannel: ReplyChannel;
  status: ThreadStatus;
  unreadByClient: boolean;
  unreadByAdmin: boolean;
  createdAt: string;
  updatedAt: string;
  lastMessageAt: string;
  messages: ContactMessage[];
}

interface OutboundEmailRecord {
  id: string;
  threadId: string;
  to: string;
  subject: string;
  body: string;
  status: "queued";
  queuedAt: string;
  requestedByAdminUserId: string;
}

type MutableStore = typeof store & {
  contactThreads: ContactThread[];
  outboundEmails: OutboundEmailRecord[];
};

const mutableStore = store as MutableStore;

function clone<T>(value: T): T {
  if (value === undefined || value === null) {
    return value;
  }
  return JSON.parse(JSON.stringify(value)) as T;
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function ensureCollections() {
  if (!mutableStore.contactThreads) {
    mutableStore.contactThreads = [];
  }
  if (!mutableStore.outboundEmails) {
    mutableStore.outboundEmails = [];
  }
  return mutableStore;
}

function validateInquiry(input: ContactThreadInput) {
  const email = input.email.trim();
  if (!input.name.trim()) {
    throw new AppError("Name is required", 400);
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new AppError("Invalid email address", 400);
  }
  if (!input.subject.trim()) {
    throw new AppError("Subject is required", 400);
  }
  if (!input.message.trim()) {
    throw new AppError("Message is required", 400);
  }
}

function findThreadOrThrow(threadId: string) {
  const thread = ensureCollections().contactThreads.find((item) => item.id === threadId);
  if (!thread) {
    throw new AppError("Contact thread not found", 404);
  }
  return thread;
}

function buildReplySubject(subject: string) {
  const cleaned = subject.trim();
  return /^re:/i.test(cleaned) ? cleaned : `Re: ${cleaned}`;
}

function normalizeChannel(value: string | undefined, fallback: ReplyChannel): ReplyChannel {
  return value === "chat" || value === "email" ? value : fallback;
}

export class ContactService {
  createThread(input: ContactThreadInput) {
    validateInquiry(input);
    const collections = ensureCollections();

    const createdAt = new Date().toISOString();
    const threadId = uuid();
    const thread: ContactThread = {
      id: threadId,
      userId: input.userId,
      name: input.name.trim(),
      email: normalizeEmail(input.email),
      company: input.company?.trim() || undefined,
      subject: input.subject.trim(),
      serviceInterest: input.serviceInterest?.trim() || undefined,
      preferredReplyChannel: input.preferredReplyChannel ?? "email",
      status: "open",
      unreadByClient: false,
      unreadByAdmin: true,
      createdAt,
      updatedAt: createdAt,
      lastMessageAt: createdAt,
      messages: [
        {
          id: uuid(),
          threadId,
          senderType: "client",
          senderUserId: input.userId,
          senderName: input.name.trim(),
          body: input.message.trim(),
          channel: input.preferredReplyChannel ?? "email",
          createdAt
        }
      ]
    };
    collections.contactThreads.push(thread);
    return clone(thread);
  }

  replyAsAdmin(threadId: string, input: AdminReplyInput) {
    if (!input.adminUserId.trim()) {
      throw new AppError("Admin user is required", 400);
    }
    if (!input.body.trim()) {
      throw new AppError("Reply body is required", 400);
    }

    const thread = findThreadOrThrow(threadId);
    const collections = ensureCollections();
    const timestamp = new Date().toISOString();
    const channel = normalizeChannel(input.channel, thread.preferredReplyChannel);
    const message: ContactMessage = {
      id: uuid(),
      threadId: thread.id,
      senderType: "admin",
      senderUserId: input.adminUserId,
      senderName: "Admin",
      body: input.body.trim(),
      channel,
      createdAt: timestamp
    };

    thread.messages.push(message);
    thread.status = "replied";
    thread.unreadByClient = true;
    thread.unreadByAdmin = false;
    thread.updatedAt = timestamp;
    thread.lastMessageAt = timestamp;

    if (channel === "email") {
      collections.outboundEmails.push({
        id: uuid(),
        threadId: thread.id,
        to: thread.email,
        subject: buildReplySubject(thread.subject),
        body: input.body.trim(),
        status: "queued",
        queuedAt: timestamp,
        requestedByAdminUserId: input.adminUserId
      });
    }

    return clone(thread);
  }

  replyAsClient(threadId: string, input: { userId: string; senderName: string; body: string }) {
    if (!input.userId.trim()) {
      throw new AppError("Client user is required", 400);
    }
    if (!input.body.trim()) {
      throw new AppError("Reply body is required", 400);
    }

    const thread = findThreadOrThrow(threadId);
    if (thread.userId !== input.userId) {
      throw new AppError("Forbidden", 403);
    }

    const timestamp = new Date().toISOString();
    thread.messages.push({
      id: uuid(),
      threadId: thread.id,
      senderType: "client",
      senderUserId: input.userId,
      senderName: input.senderName.trim() || thread.name,
      body: input.body.trim(),
      channel: "chat",
      createdAt: timestamp
    });
    thread.status = "open";
    thread.unreadByClient = false;
    thread.unreadByAdmin = true;
    thread.updatedAt = timestamp;
    thread.lastMessageAt = timestamp;

    return clone(thread);
  }

  listThreadsForUser(userId: string) {
    const collections = ensureCollections();
    const threads = [...collections.contactThreads]
      .filter((thread) => thread.userId === userId)
      .sort((left, right) => right.lastMessageAt.localeCompare(left.lastMessageAt));
    return clone(threads);
  }

  listThreadsForAdmin() {
    const threads = [...ensureCollections().contactThreads].sort((left, right) =>
      right.lastMessageAt.localeCompare(left.lastMessageAt)
    );
    return clone(threads);
  }

  getThread(threadId: string) {
    return clone(findThreadOrThrow(threadId));
  }
}

export const contactService = new ContactService();
