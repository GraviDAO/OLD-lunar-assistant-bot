import { ButtonInteraction } from "discord.js";
import { LunarAssistant } from "..";
import db from "../services/admin";
import { GuildPolls, Poll, User } from "../shared/firestoreTypes";
import { primaryEmbed } from "../utils/embeds";
import { getValidVotes } from "../utils/getValidVotes";

export default {
    customId: "pollVote",
    execute: async (
        lunarAssistant: LunarAssistant,
        interaction: ButtonInteraction
    ) => {
      const vote = interaction.customId.split(".")[1];
      let validVotes: number | undefined;

      const guildPollsDoc = await db
        .collection("guildPolls")
        .doc(interaction.guildId!)
        .get()
      
      const guildPolls: GuildPolls = guildPollsDoc.exists
      ? (guildPollsDoc.data() as GuildPolls)
      : { polls: [] };

      const poll = guildPolls.polls.find((p: Poll) => p.messageId === interaction.message.id );

      if (!poll) {
          await interaction.deferUpdate()
          return;
      }

      if (!poll.active) {
          await interaction.reply({ embeds: [ primaryEmbed(undefined, "This poll is no longer active!") ], ephemeral: true });
          return;
      }

      await interaction.deferReply({ ephemeral: true });

      if (vote === "yes") {
          if (poll.votes.yes.includes(interaction.user.id)) {
              await interaction.editReply({ embeds: [ primaryEmbed(undefined, "You already casted your vote as **Yes**") ] });
              return;
          }

          let update = false;
          if (poll.votes.no.includes(interaction.user.id)) {
            poll.votes.no.splice(poll.votes.no.indexOf(interaction.user.id), 1);
            update = true;
          }
          if (poll.votes.abstain.includes(interaction.user.id)) {
            poll.votes.abstain.splice(poll.votes.abstain.indexOf(interaction.user.id), 1);
            update = true;
          }

          poll.votes.yes.push(interaction.user.id);

          await db
            .collection("guildPolls")
            .doc(interaction.guildId!)
            .set(guildPolls)
            
          validVotes = await getValidVotes(interaction.user.id, poll.contractAddress, db);

          await interaction.editReply({ embeds: [ primaryEmbed(undefined, `${update ? "Changed your vote to **Yes**" : "You have casted your vote as **Yes**"}${validVotes === undefined ? "" : `\nYour vote is worth **${validVotes}** points.` }`) ] });

        } else if (vote === "no") {
          if (poll.votes.no.includes(interaction.user.id)) {
              await interaction.editReply({ embeds: [ primaryEmbed(undefined, "You already casted your vote as **No**") ] });
              return;
          }
          let update = false;
          if (poll.votes.yes.includes(interaction.user.id)) {
            poll.votes.yes.splice(poll.votes.yes.indexOf(interaction.user.id), 1);
            update = true;
          }
          if (poll.votes.abstain.includes(interaction.user.id)) {
            poll.votes.abstain.splice(poll.votes.abstain.indexOf(interaction.user.id), 1);
            update = true;
          }

          poll.votes.no.push(interaction.user.id);

          await db
            .collection("guildPolls")
            .doc(interaction.guildId!)
            .set(guildPolls)
            
          validVotes = await getValidVotes(interaction.user.id, poll.contractAddress, db);

          await interaction.editReply({ embeds: [ primaryEmbed(undefined, `${update ? "Changed your vote to **No**" : "You have casted your vote as **No**"}${validVotes === undefined ? "" : `\nYour vote is worth **${validVotes}** points.` }`) ] });

        } else if (vote === "abstain") {
          if (poll.votes.abstain.includes(interaction.user.id)) {
              await interaction.editReply({ embeds: [ primaryEmbed(undefined, "You already casted your vote as **Abstain**") ] });
              return;
          }
          let update = false;
          if (poll.votes.yes.includes(interaction.user.id)) {
            poll.votes.yes.splice(poll.votes.yes.indexOf(interaction.user.id), 1);
            update = true;
          }
          if (poll.votes.no.includes(interaction.user.id)) {
            poll.votes.no.splice(poll.votes.no.indexOf(interaction.user.id), 1);
            update = true;
          }

          poll.votes.abstain.push(interaction.user.id);

          await db
            .collection("guildPolls")
            .doc(interaction.guildId!)
            .set(guildPolls)
            
          validVotes = await getValidVotes(interaction.user.id, poll.contractAddress, db);

          await interaction.editReply({ embeds: [ primaryEmbed(undefined, `${update ? "Changed your vote to **Abstain**" : "You have casted your vote as **Abstain**"}${validVotes === undefined ? "" : `\nYour vote is worth **${validVotes}** points.` }`) ] });
      } else {
        if (!poll.votes.yes.includes(interaction.user.id) && !poll.votes.no.includes(interaction.user.id) && !poll.votes.abstain.includes(interaction.user.id)) {
            await interaction.editReply({ embeds: [ primaryEmbed(undefined, "You already have no vote on this poll") ] });
            return;
        }

        if (poll.votes.yes.includes(interaction.user.id)) poll.votes.yes.splice(poll.votes.yes.indexOf(interaction.user.id), 1);
        if (poll.votes.no.includes(interaction.user.id)) poll.votes.no.splice(poll.votes.no.indexOf(interaction.user.id), 1);
        if (poll.votes.abstain.includes(interaction.user.id)) poll.votes.abstain.splice(poll.votes.abstain.indexOf(interaction.user.id), 1);

        await db
          .collection("guildPolls")
          .doc(interaction.guildId!)
          .set(guildPolls)

        await interaction.editReply({ embeds: [ primaryEmbed(undefined, "You have **removed** your vote from the poll") ] });
    }

    }
}