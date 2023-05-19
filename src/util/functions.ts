import { ParticipantPopulated } from "./types";

export function userIsConversationParticipant(
  participants: Array<ParticipantPopulated>,
  userId: string
) {
  return !!participants.find((participant) => participant.userId === userId);
}
