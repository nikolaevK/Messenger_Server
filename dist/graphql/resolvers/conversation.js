"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.conversationPopulated = exports.participantPopulated = void 0;
const client_1 = require("@prisma/client");
const graphql_subscriptions_1 = require("graphql-subscriptions");
const functions_1 = require("../../util/functions");
const resolvers = {
    Query: {
        conversations: async (_, args, context) => {
            const { prisma } = context;
            const { session } = args;
            if (!(session === null || session === void 0 ? void 0 : session.user))
                throw new Error("Not Authorized");
            const { user: { id: userId }, } = session;
            try {
                const conversations = await prisma.conversation.findMany({
                    include: exports.conversationPopulated,
                });
                // getting conversations which the user is part of
                return conversations.filter((conversation) => !!conversation.participants.find((p) => p.userId === userId));
            }
            catch (error) {
                console.log("conversations error: ", error);
                throw new Error(error === null || error === void 0 ? void 0 : error.message);
            }
        },
    },
    Mutation: {
        createConversation: async (_, args, context) => {
            const { prisma, pubsub } = context;
            const { participantIds, session } = args;
            const participants = participantIds.map((participant) => JSON.parse(participant));
            if (!(session === null || session === void 0 ? void 0 : session.user))
                throw new Error("Not Authorized");
            const { user: { id: userId }, } = session;
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
                    include: exports.conversationPopulated,
                });
                pubsub.publish("CONVERSATION_CREATED", {
                    conversationCreated: conversation,
                });
                return { conversationId: conversation.id };
            }
            catch (error) {
                console.log("createConversation error", error);
                throw new Error("createConversation error");
            }
        },
        markConversationAsRead: async function (_, args, context) {
            const { prisma } = context;
            const { session, userId, conversationId } = args;
            if (!session.user)
                throw new Error("Not Authorized");
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
                        id: participant === null || participant === void 0 ? void 0 : participant.id,
                    },
                    data: {
                        hasSeenLatestMessage: true,
                    },
                });
                return true;
            }
            catch (error) {
                console.log("markConversationAsRead", error);
                throw new Error(error === null || error === void 0 ? void 0 : error.message);
            }
        },
    },
    Subscription: {
        conversationCreated: {
            subscribe: (0, graphql_subscriptions_1.withFilter)((_, __, context) => {
                const { pubsub } = context;
                return pubsub.asyncIterator(["CONVERSATION_CREATED"]);
            }, (payload, args, _) => {
                const { conversationCreated: { participants }, } = payload;
                const { session } = args;
                if (!(session === null || session === void 0 ? void 0 : session.user))
                    throw new Error("Not Authorized");
                const userIsParticipant = (0, functions_1.userIsConversationParticipant)(participants, session.user.id);
                return userIsParticipant;
            }),
        },
        conversationUpdated: {
            subscribe: (0, graphql_subscriptions_1.withFilter)((_, __, context) => {
                const { pubsub } = context;
                return pubsub.asyncIterator(["CONVERSATION_UPDATED"]);
            }, (payload, args, _) => {
                const { session } = args;
                if (!(session === null || session === void 0 ? void 0 : session.user)) {
                    throw new Error("Not Authorized");
                }
                const { id: userId } = session.user;
                const { conversationUpdated: { conversation: { participants }, }, } = payload;
                // emits updates to the participants of that conversation only
                return (0, functions_1.userIsConversationParticipant)(participants, userId);
            }),
        },
    },
};
exports.participantPopulated = client_1.Prisma.validator()({
    user: {
        select: {
            id: true,
            username: true,
            image: true,
        },
    },
});
exports.conversationPopulated = client_1.Prisma.validator()({
    participants: {
        include: exports.participantPopulated,
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
exports.default = resolvers;