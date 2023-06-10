"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const graphql_tag_1 = __importDefault(require("graphql-tag"));
const typeDef = (0, graphql_tag_1.default) `
  scalar Date
  type Query {
    conversations(session: Session): [Conversation]
  }

  type Mutation {
    createConversation(
      participantIds: [String]
      session: Session!
    ): CreateConversationResponse
  }

  type Mutation {
    markConversationAsRead(
      conversationId: String!
      session: Session!
      userId: String!
    ): Boolean
  }

  type Subscription {
    conversationCreated(session: Session): Conversation
  }

  type Subscription {
    conversationUpdated(
      session: Session
    ): ConversationUpdatedSubscriptionPayload
  }

  type CreateConversationResponse {
    conversationId: String
  }

  type ConversationUpdatedSubscriptionPayload {
    conversation: Conversation
  }

  type Conversation {
    id: String
    latestMessage: Message
    participants: [Participant]
    createdAt: Date
    updatedAt: Date
  }

  type Participant {
    id: String
    user: UserType
    hasSeenLatestMessage: Boolean
  }

  input ParticipantsInput {
    id: String
    image: String
    username: String
  }

  type UserType {
    id: String
    name: String
    username: String
    email: String
    emailVerified: Boolean
    image: String
  }

  input User {
    id: String
    name: String
    username: String
    email: String
    emailVerified: Boolean
    image: String
  }

  type SessionType {
    user: UserType
    expires: String
  }

  input Session {
    user: User
    expires: String
  }
`;
exports.default = typeDef;
