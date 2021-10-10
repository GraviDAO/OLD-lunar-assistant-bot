import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction } from "discord.js";
import { updateDiscordRolesForUser } from "../utils/updateDiscordRolesForUser";

const lunarVerify = {
  data: new SlashCommandBuilder()
    .setName("lunar-view-roles")
    .setDescription(
      "View the roles that you have been granted based on the contents of your wallet."
    )
    .addBooleanOption((option) =>
      option
        .setName("private-response")
        .setDescription(
          "Indicate whether or not you want to make the response viewable to everyone or just yourself. False by default."
        )
    ),
  execute: async (interaction: CommandInteraction) => {
    // verify the interaction is valid
    if (!interaction.guildId || !interaction.guild || !interaction.member)
      return;

    const rawPrivateResponse =
      interaction.options.getBoolean("private-response");
    const privateResponse = rawPrivateResponse ? rawPrivateResponse : false;

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
        content: `You have been granted the following roles on the following servers:\n${activeRolesMessage}`,
        ephemeral: privateResponse,
      });
    } catch {
      await interaction.reply({
        content:
          "Cannot check for roles because you haven't linked a wallet yet. Please link a wallet with /lunar-link and try again.",
        ephemeral: privateResponse,
      });
    }
  },
};

export default lunarVerify;
