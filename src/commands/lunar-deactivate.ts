import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction } from "discord.js";
import { LunarAssistant } from "..";
import { Users } from "../shared/firestoreTypes";

export default {
  data: new SlashCommandBuilder()
    .setName("lunar-deactivate")
    .setDescription("Deactivate lunar assistant for your discord account."),
  execute: async (
    lunarAssistant: LunarAssistant,
    interaction: CommandInteraction
  ) => {
    // Get the user document
    const users = (
      await lunarAssistant.db.collection("root").doc("users").get()
    ).data() as Users;

    if (users.discordIds.includes(interaction.user.id)) {
      // Will take some time to update roles, so defer reply
      await interaction.deferReply({ ephemeral: true });

      // Remove the user's id
      users.discordIds.splice(users.discordIds.indexOf(interaction.user.id), 1);
      // Update the users doc
      await lunarAssistant.db.collection("root").doc("users").set(users);

      // Update the user's discord roles
      const userActiveRoles = (
        await lunarAssistant.updateDiscordRolesForUser(interaction.user.id)
      ).activeRoles;

      // Reply
      await interaction.editReply({
        content:
          "Lunar Assistant has been deactivated for your discord account. Visit Galactic Passport if you would like to configure your linked wallets.",
      });
    } else {
      await interaction.reply({
        content: `Lunar Assistant was already deactivated for your account. Please run \`/lunar-activate\` to reactivate Lunar Assistant for your Discord account.`,
        ephemeral: true,
      });
    }
  },
};
