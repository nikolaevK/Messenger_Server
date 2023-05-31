import { Prisma } from "@prisma/client";
import { GraphQLContext, sendMessageArgs } from "../../util/types";
import { conversationPopulated } from "./conversation";

const messageResolvers = {
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
