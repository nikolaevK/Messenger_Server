import gql from "graphql-tag";

const typeDef = gql`
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

  type Mutation {
    leaveConversation(conversationId: String!, session: Session!): Boolean
  }

  type Mutation {
    deleteConversation(conversationId: String!, session: Session!): Boolean
  }

  type Subscription {
    conversationCreated(session: Session): Conversation
  }

  type Subscription {
    conversationUpdated(
      session: Session
    ): ConversationUpdatedSubscriptionPayload
  }

  type Subscription {
    conversationDeleted(
      session: Session
    ): ConversationDeletedSubscriptionPayload
  }

  type ConversationDeletedSubscriptionPayload {
    id: String
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

export default typeDef;
