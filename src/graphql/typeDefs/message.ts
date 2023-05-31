import gql from "graphql-tag";

const typeDefs = gql`
  type Message {
    id: String
    sender: UserType
    body: String
    createdAt: Date
  }

  type Mutation {
    sendMessage(
      id: String
      conversationId: String
      senderId: String
      body: String
    ): Boolean
  }
`;

export default typeDefs;
