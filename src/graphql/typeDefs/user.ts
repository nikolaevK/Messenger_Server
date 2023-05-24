import gql from "graphql-tag";

const typeDef = gql`
  type User {
    id: String
    name: String
    username: String
    email: String
    emailVerified: Boolean
    image: String
  }
  type CreateUsernameResponse {
    success: Boolean
    error: String
  }
  type SearchedUser {
    id: String
    username: String
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

  input Session {
    user: User
    expires: String
  }

  type Query {
    searchUsers(username: String, session: Session): [SearchedUser]
  }
  type Mutation {
    createUsername(username: String, session: Session): CreateUsernameResponse
  }
`;

export default typeDef;
