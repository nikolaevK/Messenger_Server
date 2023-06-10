"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.messagePopulated = void 0;
const client_1 = require("@prisma/client");
const graphql_subscriptions_1 = require("graphql-subscriptions");
const functions_1 = require("../../util/functions");
const conversation_1 = require("./conversation");
const messageResolvers = {
    Query: {
        messages: async function (_, args, context) {
            const { prisma } = context;
            const { conversationId, session } = args;
            if (!session.user)
                throw new Error("Not Authorized");
            const { id: userId } = session.user;
            // verify the conversation exists
            const conversation = await prisma.conversation.findUnique({
                where: {
                    id: conversationId,
                },
                include: conversation_1.conversationPopulated,
            });
            if (!conversation)
                throw new Error("Conversation not found!");
            // Checking if the user is participant of that conversation
            const allowedToView = (0, functions_1.userIsConversationParticipant)(conversation.participants, userId);
            if (!allowedToView)
                throw new Error("Not Authorized");
            try {
                const messages = await prisma.message.findMany({
                    where: {
                        conversationId,
                    },
                    include: exports.messagePopulated,
                    orderBy: {
                        createdAt: "desc",
                    },
                });
                return messages;
            }
            catch (error) {
                console.log("Get messages error:", error);
                throw new Error(error === null || error === void 0 ? void 0 : error.message);
            }
        },
    },
    Mutation: {
        sendMessage: async function (_, args, context) {
            const { prisma, pubsub } = context;
            const { body, id: messageId, conversationId, senderId, session } = args;
            if (!session.user)
                throw new Error("Not Authorized");
            const { user: { id: userId }, } = session;
            if (userId !== senderId)
                throw new Error("Not Authorized");
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
                    include: exports.messagePopulated,
                });
                // Finding a conversationParticipant to update hasSeenLatest message
                const participant = await prisma.conversationParticipant.findFirst({
                    where: {
                        userId,
                        conversationId,
                    },
                });
                if (!participant)
                    throw new Error("Participant does not exist!");
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
                                    id: participant === null || participant === void 0 ? void 0 : participant.id,
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
                    include: conversation_1.conversationPopulated,
                });
                pubsub.publish("MESSAGE_SENT", { messageSent: newMessage }); // passing down new message to update the UI
                pubsub.publish("CONVERSATION_UPDATED", {
                    conversationUpdated: {
                        conversation,
                    },
                });
            }
            catch (error) {
                console.log("sendMessage Error", error);
                throw new Error("sendMessage Error");
            }
            return true;
        },
    },
    Subscription: {
        // Updates UI on the front end to display newly sent message to conversation participants
        messageSent: {
            subscribe: (0, graphql_subscriptions_1.withFilter)((_, __, context) => {
                const { pubsub } = context;
                return pubsub.asyncIterator(["MESSAGE_SENT"]);
            }, (payload, args, context) => {
                // Only push an update if the message is in
                // the right conversation
                return payload.messageSent.conversationId === args.conversationId;
            }),
        },
    },
};
exports.messagePopulated = client_1.Prisma.validator()({
    sender: {
        select: {
            id: true,
            username: true,
        },
    },
});
exports.default = messageResolvers;
