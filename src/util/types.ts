import { PrismaClient } from "@prisma/client";
import { PubSub } from "graphql-subscriptions";
import { ISODateString } from "next-auth";
import { Prisma } from "@prisma/client";
import { Context } from "graphql-ws/lib/server";
import {
  conversationPopulated,
  participantPopulated,
} from "../graphql/resolvers/conversation";
import { messagePopulated } from "../graphql/resolvers/message";

export interface GraphQLContext {
  prisma: PrismaClient;
  pubsub: PubSub;
}

export interface Session {
  user?: User;
  expires: ISODateString;
}

export interface User {
  id: string;
  username: string;
  email: string;
  emailVerified: boolean;
  image: string;
  name: string;
}

export interface ConversationParticipant {
  id: string;
  username: string;
  image: string;
}

export interface CreateUsernameResponse {
  success?: boolean;
  error?: string;
}

export type ConversationPopulated = Prisma.ConversationGetPayload<{
  include: typeof conversationPopulated;
}>;

export type ParticipantPopulated = Prisma.ConversationParticipantGetPayload<{
  include: typeof participantPopulated;
}>;

export interface SubscriptionContext extends Context {
  connectionParams: {
    session?: Session;
  };
}

export interface sendMessageArgs {
  id: string;
  conversationId: string;
  senderId: string;
  body: string;
  session: Session;
}

export interface MessageSentSubscriptionPayload {
  messageSent: MessagePopulated;
  session: Session;
}

export type MessagePopulated = Prisma.MessageGetPayload<{
  include: typeof messagePopulated;
}>;
