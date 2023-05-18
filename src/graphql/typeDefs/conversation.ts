import gql from "graphql-tag";

const typeDef = gql`
  type Mutation {
    createConversation(
      participantIds: [String]
      session: Session
    ): CreateConversationResponse
  }

  type CreateConversationResponse {
    conversationId: String
  }

  input User {
    id: String
    name: String
    username: String
    email: String
    emailVerified: Boolean
    image: String
  }

  input Session {
    user: User
    expires: String
  }
`;

export default typeDef;
