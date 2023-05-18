import { GraphQLContext, Session } from "../../util/types";

const resolvers = {
  Mutation: {
    createConversation: async (
      _: any,
      args: { participantIds: Array<string>; session: Session },
      context: GraphQLContext
    ): Promise<{ conversationId: string }> => {
      const { prisma, pubsub } = context;
      const { participantIds, session } = args;

      if (!session?.user) throw new Error("Not Authorized");

      const {
        user: { id: userId },
      } = session;

      try {
        const conversation = await prisma.conversation.create({
          data: {
            participants: {
              createMany: {
                data: participantIds.map((id) => ({
                  userId: id,
                  hasSeenLatestMessage: id === userId,
                })),
              },
            },
          },
        });
        return { conversationId: conversation.id };
      } catch (error: any) {
        console.log("createConversation error", error);
        throw new Error("createConversation error");
      }
    },
  },
};

export default resolvers;
