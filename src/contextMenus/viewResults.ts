import { ContextMenuCommandBuilder } from "@discordjs/builders";
import { MessageContextMenuInteraction } from "discord.js";
import { LunarAssistant } from "..";
import db from "../services/admin";
import { GuildPolls, Poll } from "../shared/firestoreTypes";
import { pollResultsEmbed, primaryEmbed } from "../utils/embeds";
import { calculatePollResults } from "../utils/calculatePollResults";

export default {
    data: new ContextMenuCommandBuilder()
      .setName("View Poll Results")
      .setDefaultPermission(false)
      .setType(3),
    execute: async (
      lunarAssistant: LunarAssistant,
      interaction: MessageContextMenuInteraction
    ) => {
      const message = interaction.targetMessage;

      if (message.author.id !== lunarAssistant.client.user?.id) {
          await interaction.reply({ embeds: [ primaryEmbed(undefined, "Invalid poll message.") ], ephemeral: true })
          return;
      }

      const guildPollsDoc = await db
        .collection("guildPolls")
        .doc(interaction.guildId!)
        .get()
      
      const guildPolls: GuildPolls = guildPollsDoc.exists
      ? (guildPollsDoc.data() as GuildPolls)
      : { polls: [] };

      const poll = guildPolls.polls.find((p: Poll) => p.messageId === message.id );
      
      if (!poll) {
          await interaction.reply({ embeds: [ primaryEmbed(undefined, "Invalid poll message.") ], ephemeral: true })
          return;
      }

      if (poll.active) {
        await interaction.reply({ embeds: [ primaryEmbed(undefined, "This poll is still open, you need to close it before viewing the results.") ], ephemeral: true })
        return;
      }

      await interaction.deferReply({ ephemeral: true });

      await interaction.followUp({ embeds: [ primaryEmbed(undefined, "This action might take a while, please standby.") ] })

      if (!poll.results) {
        poll.results = await calculatePollResults(lunarAssistant, poll);

        await db
          .collection("guildPolls")
          .doc(interaction.guildId!)
          .set(guildPolls);
      }
      
      await new Promise((r) => setTimeout(r, 1000));
      
      await interaction.editReply({ embeds: [ pollResultsEmbed(poll) ] })
    }
}