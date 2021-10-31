import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction } from "discord.js";
import { LunarAssistant } from "..";
import db from "../services/admin";
import { User } from "../shared/firestoreTypes";

export default {
  data: new SlashCommandBuilder()
    .setName("lunar-view-wallet")
    .setDescription("View the wallet linked to your discord account."),
  execute: async (
    lunarAssistant: LunarAssistant,
    interaction: CommandInteraction
  ) => {
    // get the user document
    const userDoc = await db.collection("users").doc(interaction.user.id).get();

    if (userDoc.exists) {
      const wallet = (userDoc.data() as User).wallet;
      const finderBaseAddress = "https://finder.terra.money/columbus-5/address";

      await interaction.reply({
        content: "Your registered wallet: " + wallet,
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
