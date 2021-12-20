import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction } from "discord.js";
import { LunarAssistant } from "..";
import { passportApi } from "../services/passport";
import { Users } from "../shared/firestoreTypes";
import { RandomEarthAPIError } from "../types/errors";

const lunarVerify = {
  data: new SlashCommandBuilder()
    .setName("lunar-view-roles")
    .setDescription(
      "View the roles that you have been granted based on the contents of your wallets linked on Galactic Passport."
    )
    .addBooleanOption((option) =>
      option
        .setName("private-response")
        .setDescription(
          "Indicate whether or not the response should be public or private. Public by default."
        )
    ),
  execute: async (
    lunarAssistant: LunarAssistant,
    interaction: CommandInteraction
  ) => {
    // verify the interaction is valid
    if (!interaction.guildId || !interaction.guild || !interaction.member)
      return;

    const rawPrivateResponse =
      interaction.options.getBoolean("private-response");
    const privateResponse = rawPrivateResponse ? rawPrivateResponse : false;

    await interaction.deferReply({ ephemeral: privateResponse });

    const walletAddresses = await passportApi.getWalletsByDiscordId(
      interaction.user.id
    );

    const users = (
      await lunarAssistant.db.collection("root").doc("users").get()
    ).data() as Users;

    if (
      users.discordIds.includes(interaction.user.id) &&
      walletAddresses.length > 0
    ) {
      try {
        const userActiveRoles = (
          await lunarAssistant.updateDiscordRolesForUser(interaction.user.id)
        ).activeRoles;

        if (Object.keys(userActiveRoles).length > 0) {
          const activeRolesMessage = Object.keys(userActiveRoles)
            .map(
              (guildName) =>
                `${guildName}: ${userActiveRoles[guildName].join(", ")}`
            )
            .join("\n");

          await interaction.editReply({
            content: `Hello ser! You have been granted the following roles on the following servers: \n${activeRolesMessage}`,
          });
        } else {
          await interaction.editReply({
            content: `You have not been granted any roles.`,
          });
        }
      } catch (error) {
        if (error instanceof RandomEarthAPIError) {
          await interaction.editReply({
            content:
              "The bot is having trouble reading the RandomEarth listings, please try again later. Roles will be frozen until the bot can read RandomEarth listings again.",
          });
        } else {
          console.error("Unknown error when running /lunar-view-roles:");
          console.error(error);

          await interaction.editReply({
            content: "There was an unknown error while executing this command!",
          });
        }
      }
    } else if (walletAddresses.length > 0) {
      await interaction.editReply({
        content:
          "Cannot check for roles because you haven't activated Lunar Assistant for your Discord account yet. Please activate Lunar Assistant with /lunar-activate.",
      });
    } else {
      await interaction.editReply({
        content:
          "Cannot check for roles because you haven't linked your wallet with Galactic Passport or activated Lunar Assistant for your Discord account. Please go to https://galacticpassport.app, log in with your Discord account, link your relevant wallets, and then run `/lunar-activate`.",
      });
    }
  },
};

export default lunarVerify;
