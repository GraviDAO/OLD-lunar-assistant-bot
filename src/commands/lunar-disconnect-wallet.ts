import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction } from "discord.js";
import { LunarAssistant } from "..";
import db from "../services/admin";

export default {
  data: new SlashCommandBuilder()
    .setName("lunar-disconnect-wallet")
    .setDescription("Disconnect the wallet linked to your discord account."),
  execute: async (
    lunarAssistant: LunarAssistant,
    interaction: CommandInteraction
  ) => {
    const userRef = db.collection("users").doc(interaction.user.id);
    const statsRef = db.collection("root").doc("stats");
    // get the user document
    const userDoc = await userRef.get();

    if (userDoc.exists) {
      const batch = db.batch();
      const increment = FirebaseFirestore.FieldValue.increment(-1);

      // delete the users document
      batch.delete(userRef);
      batch.set(statsRef, { userCount: increment }, { merge: true });

      await batch.commit();

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
