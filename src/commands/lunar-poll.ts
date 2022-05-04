import { SlashCommandBuilder } from "@discordjs/builders";
import { showModal } from "discord-modals";
import { AutocompleteInteraction, CommandInteraction } from "discord.js";
import { LunarAssistant } from "..";
import { pollCreateModal } from "../utils/modals";
import db from "../services/admin";
import { GuildPolls, Poll } from "../shared/firestoreTypes";
import { pollsEmbed } from "../utils/embeds";

export default {
  data: new SlashCommandBuilder()
    .setName("lunar-poll")
    .setDescription("Manage off-chain polls on your discord.")
    .addSubcommand((command) => 
      command
        .setName("create")
        .setDescription("Create a Poll.")
    )
    .addSubcommand((command) => 
      command
        .setName("list")
        .setDescription("Shows a list of all polls.")
        .addStringOption((option) => 
        option
          .setName("status")
          .setDescription("Filter polls by their statuses.")
          .addChoices(
            {
              name: "All Polls",
              value: "all"
            },
            {
              name: "Finished Polls",
              value: "closed"
            },
            {
              name: "Open Polls",
              value: "open"
            }
          )
        )
    ),
  execute: async (
    lunarAssistant: LunarAssistant,
    interaction: CommandInteraction
  ) => {
    // verify the interaction is valid
    if (!interaction.guildId || !interaction.guild || !interaction.member)
      return;
    
    const subcommand = interaction.options.getSubcommand(true);

    if (subcommand === "create") {
      showModal(pollCreateModal(), { client: lunarAssistant.client, interaction: interaction })
    }
    if (subcommand === "list") {
      const status = interaction.options.getString("status") ?? "all";

      const guildPollsDoc = await db
      .collection("guildPolls")
      .doc(interaction.guildId!)
      .get()

      const guildPolls: GuildPolls = guildPollsDoc.exists
        ? (guildPollsDoc.data() as GuildPolls)
        : { polls: [] };

      
      const filteredPolls = guildPolls.polls.filter((poll: Poll) => status === "all" || status === "closed" && !poll.active || status === "open" && poll.active);

      await interaction.reply({ embeds: [ pollsEmbed(filteredPolls) ], ephemeral: true })
    }
  }
};
