import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction } from "discord.js";
import { LunarAssistant } from "..";
import { passportApi } from "../services/passport";

export default {
  data: new SlashCommandBuilder()
    .setName("lunar-disconnect-wallet")
    .setDescription("Disconnect the wallet linked to your discord account."),
  execute: async (
    lunarAssistant: LunarAssistant,
    interaction: CommandInteraction
  ) => {
    // get the user document
    const userWallets = await passportApi.getWalletsByDiscordId(
      interaction.user.id
    );

    if (userWallets && userWallets.length > 0) {
      await interaction.reply({
        content: "Visit Passport in order to configure your linked wallets.",
        ephemeral: true,
      });
    } else {
      await interaction.reply({
        content:
          "You haven't linked a wallet yet, so there is no wallet to disconnect.",
        ephemeral: true,
      });
    }
  },
};
