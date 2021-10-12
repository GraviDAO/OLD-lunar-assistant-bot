import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction } from "discord.js";
import db from "../services/admin";

export default {
  data: new SlashCommandBuilder()
    .setName("lunar-disconnect-wallet")
    .setDescription("Disconnect the wallet linked to your discord account."),
  execute: async (interaction: CommandInteraction) => {
    // get the user document
    const userDoc = await db.collection("users").doc(interaction.user.id).get();

    if (userDoc.exists) {
      // delete the users document
      await db.collection("users").doc(interaction.user.id).delete();

      await interaction.reply({
        content: "Your wallet has been disconnected successfully",
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
