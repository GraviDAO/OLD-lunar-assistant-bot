import { GuildChannel, Message } from "discord.js";
import { GuildPolls, Poll } from "../shared/firestoreTypes";
import db from "../services/admin";
import { castPollVoteButtons } from "./buttons";
import { pollResultsEmbed } from "./embeds";
import { calculatePollResults } from "./calculatePollResults";
import { LunarAssistant } from "..";

export const archivePoll = async (
  lunarAssistant: LunarAssistant,
  message: Message,
  poll: Poll
) => {
  const guildPollsDoc = await db
    .collection("guildPolls")
    .doc(message.guildId!)
    .get()

  const guildPolls: GuildPolls = guildPollsDoc.exists
  ? (guildPollsDoc.data() as GuildPolls)
  : { polls: [] };

  const p = guildPolls.polls.find((p: Poll) => p.uuid === poll.uuid );
  if (!p) return;

  if (!poll.results) poll.results = await calculatePollResults(lunarAssistant, poll);


  console.log(`Archiving poll: ${poll.uuid}`)
  await message.edit({ components: [ castPollVoteButtons(false) ] });
  if (message.thread && !message.thread.archived) {
    try {
      await message.thread.setArchived(true, "Poll Closed");
    } catch (error) {
      console.log(`Could not archive thread: ${message.thread.name}`)
    }
  }
  try {
    await message.reply({ embeds: [ pollResultsEmbed(poll) ] });
  } catch (error) {
    console.log(error);
    
    console.log(`Could not post results for poll on: ${(message.channel as GuildChannel).name}`)
  }

  p.active = false;

  await db
    .collection("guildPolls")
    .doc(message.guildId!)
    .set(guildPolls)
};
