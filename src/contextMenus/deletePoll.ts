import { ContextMenuCommandBuilder } from "@discordjs/builders";
import { MessageContextMenuInteraction } from "discord.js";
import { LunarAssistant } from "..";
import db from "../services/admin";
import { GuildPolls, Poll } from "../shared/firestoreTypes";
import { pollResultsEmbed, primaryEmbed } from "../utils/embeds";

export default {
    data: new ContextMenuCommandBuilder()
      .setName("Delete Poll")
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
        await interaction.reply({ embeds: [ primaryEmbed(undefined, "This poll is still open, you need to close it before deleting it.") ], ephemeral: true })
        return;
      }

      if (poll.active) {
        await interaction.reply({ embeds: [ primaryEmbed(undefined, "This poll is still open, you need to close it before deleting it.") ], ephemeral: true })
        return;
      }

      guildPolls.polls.splice(guildPolls.polls.indexOf(poll), 1);

      await db
        .collection("guildPolls")
        .doc(interaction.guildId!)
        .set(guildPolls);

      const embeds = [ primaryEmbed(undefined, "Deleted the poll from our database. You can find bellow the final results,") ];

      if (poll.results) embeds.push(pollResultsEmbed(poll));

      await interaction.reply({ embeds: embeds, ephemeral: true })
        
    }
}