import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction } from "discord.js";
import { LunarAssistant } from "..";
import { passportApi } from "../services/passport";
import { Users } from "../shared/firestoreTypes";

export default {
  data: new SlashCommandBuilder()
    .setName("lunar-activate")
    .setDescription("Activate lunar assistant for your discord account."),
  execute: async (
    lunarAssistant: LunarAssistant,
    interaction: CommandInteraction
  ) => {
    // Check if the discord account exists

    const userWallets = await passportApi.getWalletsByDiscordId(
      interaction.user.id
    );

    if (userWallets && userWallets.length > 0) {
      const users = (
        await lunarAssistant.db.collection("root").doc("users").get()
      ).data() as Users;

      if (users.discordIds.includes(interaction.user.id)) {
        await interaction.reply({
          content: `Lunar Assistant has already been activated for your Discord account. Please run \`/lunar-view-roles\` to see the roles you have been granted.`,
          ephemeral: true,
        });
      } else {
        // Will take some time to update roles, so defer reply
        await interaction.deferReply({ ephemeral: true });

        // Push the user's id
        users.discordIds.push(interaction.user.id);
        // Update the users doc
        await lunarAssistant.db.collection("root").doc("users").set(users);

        // Update the user's discord roles
        const userActiveRoles = (
          await lunarAssistant.updateDiscordRolesForUser(interaction.user.id)
        ).activeRoles;

        // Get the active roles message
        const activeRolesMessage = Object.keys(userActiveRoles)
          .map(
            (guildName) =>
              `${guildName}: ${userActiveRoles[guildName].join(", ")}`
          )
          .join("\n");

        // Reply
        await interaction.editReply({
          content: `Lunar Assistant has been activated for your discord account! You have been granted the following roles on the following servers: \n${activeRolesMessage}\n\nIf you ever want to see your list of roles or force a role update, just run /lunar-view-roles.`,
        });
      }
    } else {
      await interaction.reply({
        content: `In order to activate Lunar Assistant for your Discord account, you must have a wallet linked to your Discord account on Galactic Passport. Please go to https://galacticpassport.app, log in with your Discord account, link your relevant wallets, and then try running \`/lunar-activate\` again.`,
        ephemeral: true,
      });
    }
  },
};
