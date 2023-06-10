import { Prisma } from "@prisma/client";
import { withFilter } from "graphql-subscriptions";
import { userIsConversationParticipant } from "../../util/functions.js";
import {
  ConversationPopulated,
  ConversationUpdatedSubscriptionPayload,
  GraphQLContext,
  Session,
} from "../../util/types.js";

const resolvers = {
  Query: {
    conversations: async (
      _: any,
      args: { session: Session },
      context: GraphQLContext
    ): Promise<Array<ConversationPopulated>> => {
      const { prisma } = context;
      const { session } = args;

      if (!session?.user) throw new Error("Not Authorized");

      const {
        user: { id: userId },
      } = session;

      try {
        const conversations = await prisma.conversation.findMany({
          include: conversationPopulated,
        });

        // getting conversations which the user is part of
        return conversations.filter(
          (conversation) =>
            !!conversation.participants.find((p) => p.userId === userId)
        );
      } catch (error: any) {
        console.log("conversations error: ", error);
        throw new Error(error?.message);
      }
    },
  },
  Mutation: {
    createConversation: async (
      _: any,
      args: { participantIds: Array<string>; session: Session },
      context: GraphQLContext
    ): Promise<{ conversationId: string }> => {
      const { prisma, pubsub } = context;
      const { participantIds, session } = args;
      const participants = participantIds.map((participant) =>
        JSON.parse(participant)
      );

      if (!session?.user) throw new Error("Not Authorized");

      const {
        user: { id: userId },
      } = session;

      try {
        const conversation = await prisma.conversation.create({
          data: {
            participants: {
              createMany: {
                data: participants.map((p) => ({
                  userId: p.id,
                  hasSeenLatestMessage: p.id === userId,
                  imageUrl: p.image,
                })),
              },
            },
          },
          include: conversationPopulated,
        });

        pubsub.publish("CONVERSATION_CREATED", {
          conversationCreated: conversation,
        });

        return { conversationId: conversation.id };
      } catch (error: any) {
        console.log("createConversation error", error);
        throw new Error("createConversation error");
      }
    },
    markConversationAsRead: async function (
      _: any,
      args: { userId: string; session: Session; conversationId: string },
      context: GraphQLContext
    ): Promise<boolean> {
      const { prisma } = context;
      const { session, userId, conversationId } = args;

      if (!session.user) throw new Error("Not Authorized");

      try {
        // getting the Id of a participant to update Reading status
        const participant = await prisma.conversationParticipant.findFirst({
          where: {
            userId,
            conversationId,
          },
        });

        // Updating read status of a participant
        await prisma.conversationParticipant.update({
          where: {
            id: participant?.id,
          },
          data: {
            hasSeenLatestMessage: true,
          },
        });

        return true;
      } catch (error: any) {
        console.log("markConversationAsRead", error);
        throw new Error(error?.message);
      }
    },
  },
  Subscription: {
    conversationCreated: {
      subscribe: withFilter(
        (_: any, __: any, context: GraphQLContext) => {
          const { pubsub } = context;
          return pubsub.asyncIterator(["CONVERSATION_CREATED"]);
        },
        (
          payload: ConversationCreatedSubscriptionPayload,
          args: { session: Session },
          _: any
        ) => {
          const {
            conversationCreated: { participants },
          } = payload;
          const { session } = args;

          if (!session?.user) throw new Error("Not Authorized");

          const userIsParticipant = userIsConversationParticipant(
            participants,
            session.user.id
          );
          return userIsParticipant;
        }
      ),
    },
    conversationUpdated: {
      subscribe: withFilter(
        (_: any, __: any, context: GraphQLContext) => {
          const { pubsub } = context;
          return pubsub.asyncIterator(["CONVERSATION_UPDATED"]);
        },
        (
          payload: ConversationUpdatedSubscriptionPayload,
          args: { session: Session },
          _: any
        ) => {
          const { session } = args;

          if (!session?.user) {
            throw new Error("Not Authorized");
          }

          const { id: userId } = session.user;
          const {
            conversationUpdated: {
              conversation: { participants },
            },
          } = payload;

          // emits updates to the participants of that conversation only
          return userIsConversationParticipant(participants, userId);
        }
      ),
    },
  },
};

export interface ConversationCreatedSubscriptionPayload {
  conversationCreated: ConversationPopulated;
}

export const participantPopulated =
  Prisma.validator<Prisma.ConversationParticipantInclude>()({
    user: {
      select: {
        id: true,
        username: true,
        image: true,
      },
    },
  });

export const conversationPopulated =
  Prisma.validator<Prisma.ConversationInclude>()({
    participants: {
      include: participantPopulated,
    },
    latestMessage: {
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            image: true,
          },
        },
      },
    },
  });

export default resolvers;
