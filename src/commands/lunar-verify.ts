import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction } from "discord.js";
import { updateDiscordRolesForUser } from "../utils/updateDiscordRolesForUser";

const lunarVerify = {
  data: new SlashCommandBuilder()
    .setName("lunar-verify")
    .setDescription(
      "Updates your discord roles based on the contents of your wallet."
    ),
  execute: async (interaction: CommandInteraction) => {
    // verify the interaction is valid
    if (!interaction.guildId || !interaction.guild || !interaction.member)
      return;

    try {
      const usersActiveRoles = (
        await updateDiscordRolesForUser(interaction.client, interaction.user.id)
      ).activeRoles;

      const activeRolesMessage = Object.keys(usersActiveRoles)
        .map(
          (guildName) =>
            `${guildName}: ${usersActiveRoles[guildName].join(", ")}`
        )
        .join("\n");

      await interaction.reply({
        content: `Your roles have been updated! You have been granted the following roles on the following servers:\n${activeRolesMessage}`,
      });
    } catch {
      await interaction.reply(
        "Cannot check for roles because you haven't linked a wallet yet. Please link a wallet with /lunar-link and try again."
      );
    }
  },
};

export default lunarVerify;
