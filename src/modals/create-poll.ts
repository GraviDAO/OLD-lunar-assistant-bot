import { ModalSubmitInteraction } from "discord-modals";
import { LunarAssistant } from "..";
import { GuildPolls, Poll } from "../shared/firestoreTypes";
import { pollEmbed, primaryEmbed } from "../utils/embeds";
import db from "../services/admin";
import { Message, TextChannel } from "discord.js";
import { castPollVoteButtons } from "../utils/buttons";
import { timeToTimestamp } from "../utils/timeToTimestamp";
import { archivePoll } from "../utils/archivePoll";

export default {
  customId: "create-poll",
  execute: async (
    lunarAssistant: LunarAssistant,
    interaction: ModalSubmitInteraction
  ) => {
    await interaction.deferReply({ ephemeral: true });

    const nftAddress = interaction.getTextInputValue("nftAddress");

    if (nftAddress.length != 44 || !nftAddress.startsWith("terra", 0)) {
      await interaction.followUp({
        content: "Invalid terra address",
      });
      return;
    }

    const quorum = parseFloat(interaction.getTextInputValue("quorum") ?? 0);
    if (quorum < 0 || quorum > 100) {
      await interaction.followUp({
        content: "Invalid quorum value",
      });
      return;
    }

    const guildPollsDoc = await db
      .collection("guildPolls")
      .doc(interaction.guildId!)
      .get();

    const guildPolls: GuildPolls = guildPollsDoc.exists
      ? !(guildPollsDoc.data() as GuildPolls).polls
        ? { polls: [] }
        : (guildPollsDoc.data() as GuildPolls)
      : { polls: [] };

    const data: Poll = {
      title: interaction.getTextInputValue("title"),
      description: interaction.getTextInputValue("description"),
      creator: interaction.user.id,
      uuid: (
        ((guildPolls.polls?.length ?? 0) !== 0
          ? parseInt(guildPolls.polls[guildPolls.polls?.length - 1]!.uuid)
          : 0) + 1
      )
        .toString()
        .padStart(3, "0"),
      active: true,
      quorum: quorum,
      endsAt: timeToTimestamp(interaction.getTextInputValue("time") ?? "14d"),
      votes: {
        yes: [],
        no: [],
        abstain: [],
      },
      contractAddress: nftAddress,
    };

    try {
      const message = await interaction.channel!.send({
        embeds: [pollEmbed(data, interaction.user)],
        components: [castPollVoteButtons()],
      });
      data.messageId = message.id;
      data.channelId = message.channelId;
      if (message.channel instanceof TextChannel) {
        try {
          await message.channel.threads.create({
            startMessage: message.id,
            name: `Discussion - ${data.title}`,
            autoArchiveDuration:
              message.guild!.premiumTier === "NONE" ? 1440 : 4320,
          });
        } catch (error) {
          await interaction.followUp({
            embeds: [
              primaryEmbed(
                "Could not create a thread",
                "Please make sure I have permission to create threads."
              ),
            ],
          });
        }
      }
      setTimeout(() => {
        archivePoll(lunarAssistant, message, data);
      }, data.endsAt - Date.now());
    } catch (error) {
      await interaction.followUp({
        embeds: [
          primaryEmbed(
            "Could not send poll message",
            "Please make sure I have permission to send messages on that channel."
          ),
        ],
      });
      return;
    }

    guildPolls.polls.push(data);

    await db.collection("guildPolls").doc(interaction.guildId!).set(guildPolls);

    await interaction.followUp({
      embeds: [primaryEmbed(undefined, "Proposal Successfully Created!")],
      ephemeral: true,
    });
  },
};
