import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction } from "discord.js";
import db from "../services/admin";

export default {
  data: new SlashCommandBuilder()
    .setName("lunar-display-wallet")
    .setDescription("Diplays the wallet linked to your discord account."),
  execute: async (interaction: CommandInteraction) => {
    // get the user document
    const userDoc = await db.collection("users").doc(interaction.user.id).get();

    if (userDoc.exists) {
      const wallets = (userDoc.data() as User).wallets;
      const finderBaseAddress = "https://finder.terra.money/columbus-5/address";
      const walletMessage = wallets
        .map(
          (walletAddress) =>
            `[${walletAddress}](${finderBaseAddress + walletAddress})`
        )
        .join("\n");

      await interaction.reply({
        content: "Your registered wallets: \n" + walletMessage,
        ephemeral: true,
      });
    } else {
      await interaction.reply(
        "You haven't linked any wallets yet. Link a wallet with /lunar-link"
      );
    }
  },
};
