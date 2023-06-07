import { Prisma } from "@prisma/client";
import { userIsConversationParticipant } from "../../util/functions";
import {
  GraphQLContext,
  MessagePopulated,
  sendMessageArgs,
  Session,
} from "../../util/types";
import { conversationPopulated } from "./conversation";

const messageResolvers = {
  Query: {
    messages: async function (
      _: any,
      args: { conversationId: string; session: Session },
      context: GraphQLContext
    ): Promise<Array<MessagePopulated>> {
      const { prisma, pubsub } = context;
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
      } catch (error: any) {
        console.log("sendMessage Error", error);
        throw new Error("sendMessage Error");
      }
      return true;
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

export default messageResolvers;
