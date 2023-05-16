import { PrismaClient } from "@prisma/client";
import { PubSub } from "graphql-subscriptions";
import { ISODateString } from "next-auth";
import { Prisma } from "@prisma/client";
import { Context } from "graphql-ws/lib/server";

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

export interface CreateUsernameResponse {
  success?: boolean;
  error?: string;
}

export interface SubscriptionContext extends Context {
  connectionParams: {
    session?: Session;
  };
}
