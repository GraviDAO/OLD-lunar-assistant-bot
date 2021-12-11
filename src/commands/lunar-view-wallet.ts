import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction } from "discord.js";
import { LunarAssistant } from "..";
import { passportApi } from "../services/passport";

export default {
  data: new SlashCommandBuilder()
    .setName("lunar-view-wallet")
    .setDescription("View the wallet linked to your discord account."),
  execute: async (
    lunarAssistant: LunarAssistant,
    interaction: CommandInteraction
  ) => {
    // get the user wallet addresses
    const walletAddresses = await passportApi.getWalletsByDiscordId(
      interaction.user.id
    );

    if (walletAddresses.length > 0) {
      await interaction.reply({
        content: `Your registered wallets: ${walletAddresses.join(",")}`,
        ephemeral: true,
      });
    } else {
      await interaction.reply({
        content:
          "You haven't linked any wallets yet. Link a wallet with /lunar-link",
        ephemeral: true,
      });
    }
  },
};
