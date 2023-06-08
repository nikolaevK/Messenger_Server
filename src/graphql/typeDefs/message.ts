import gql from "graphql-tag";

const typeDefs = gql`
  type Message {
    id: String
    sender: UserType
    imageUrl: String
    body: String
    createdAt: Date
  }

  type Query {
    messages(conversationId: String, session: Session): [Message]
  }

  type Mutation {
    sendMessage(
      id: String
      conversationId: String
      senderId: String
      body: String
      session: Session
    ): Boolean
  }

  type Subscription {
    messageSent(conversationId: String): Message
  }
`;

export default typeDefs;
