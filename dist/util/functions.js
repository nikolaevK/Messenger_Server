export function userIsConversationParticipant(participants, userId) {
    return !!participants.find((participant) => participant.userId === userId);
}
