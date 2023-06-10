"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const graphql_tag_1 = __importDefault(require("graphql-tag"));
const typeDef = (0, graphql_tag_1.default) `
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
exports.default = typeDef;
