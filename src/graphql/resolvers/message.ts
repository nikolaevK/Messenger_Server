import { Prisma } from "@prisma/client";
import { withFilter } from "graphql-subscriptions";
import { userIsConversationParticipant } from "../../util/functions.js";
import {
  GraphQLContext,
  MessagePopulated,
  MessageSentSubscriptionPayload,
  sendMessageArgs,
  Session,
} from "../../util/types";
import { conversationPopulated } from "./conversation";

const resolvers = {
  Query: {
    messages: async function (
      _: any,
      args: { conversationId: string; session: Session },
      context: GraphQLContext
    ): Promise<Array<MessagePopulated>> {
      const { prisma } = context;
      const { conversationId, session } = args;

      if (!session.user) throw new Error("Not Authorized");

      const { id: userId } = session.user;

      // verify the conversation exists
      const conversation = await prisma.conversation.findUnique({
        where: {
          id: conversationId,
        },
        include: conversationPopulated,
      });

      if (!conversation) throw new Error("Conversation not found!");

      // Checking if the user is participant of that conversation
      const allowedToView = userIsConversationParticipant(
        conversation.participants,
        userId
      );

      if (!allowedToView) throw new Error("Not Authorized");

      try {
        const messages = await prisma.message.findMany({
          where: {
            conversationId,
          },
          include: messagePopulated,
          orderBy: {
            createdAt: "desc",
          },
        });

        return messages;
      } catch (error: any) {
        console.log("Get messages error:", error);
        throw new Error(error?.message);
      }
    },
  },
  Mutation: {
    sendMessage: async function (
      _: any,
      args: sendMessageArgs,
      context: GraphQLContext
    ): Promise<boolean> {
      const { prisma, pubsub } = context;
      const { body, id: messageId, conversationId, senderId, session } = args;

      if (!session.user) throw new Error("Not Authorized");
      const {
        user: { id: userId },
      } = session;

      if (userId !== senderId) throw new Error("Not Authorized");

      try {
        // Creating a new message
        const newMessage = await prisma.message.create({
          data: {
            id: messageId,
            senderId,
            conversationId,
            body,
            imageUrl: session.user.image,
          },
          include: messagePopulated,
        });

        // Finding a conversationParticipant to update hasSeenLatest message
        const participant = await prisma.conversationParticipant.findFirst({
          where: {
            userId,
            conversationId,
          },
        });

        if (!participant) throw new Error("Participant does not exist!");

        // Update conversation entity to reflect the changes of latest message in conversation
        // Update hasSeenLatestMessage to reflect UI of a sender
        const conversation = await prisma.conversation.update({
          where: {
            id: conversationId,
          },
          data: {
            latestMessageId: newMessage.id,
            participants: {
              update: {
                where: {
                  id: participant?.id,
                },
                data: {
                  hasSeenLatestMessage: true,
                },
              },
              updateMany: {
                where: {
                  NOT: {
                    userId,
                  },
                },
                data: {
                  hasSeenLatestMessage: false,
                },
              },
            },
          },
          include: conversationPopulated,
        });

        pubsub.publish("MESSAGE_SENT", { messageSent: newMessage }); // passing down new message to update the UI
        pubsub.publish("CONVERSATION_UPDATED", {
          conversationUpdated: {
            conversation,
          },
        });
      } catch (error: any) {
        console.log("sendMessage Error", error);
        throw new Error("sendMessage Error");
      }
      return true;
    },
  },
  Subscription: {
    // Updates UI on the front end to display newly sent message to conversation participants
    messageSent: {
      subscribe: withFilter(
        (_: any, __: any, context: GraphQLContext) => {
          const { pubsub } = context;
          return pubsub.asyncIterator(["MESSAGE_SENT"]);
        },
        (
          payload: MessageSentSubscriptionPayload,
          args: { conversationId: string },
          context: GraphQLContext
        ) => {
          // Only push an update if the message is in
          // the right conversation
          return payload.messageSent.conversationId === args.conversationId;
        }
      ),
    },
  },
};

export const messagePopulated = Prisma.validator<Prisma.MessageInclude>()({
  sender: {
    select: {
      id: true,
      username: true,
    },
  },
});

export default resolvers;
