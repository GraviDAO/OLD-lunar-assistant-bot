import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction } from "discord.js";
import { LunarAssistant } from "..";
import { passportApi } from "../services/passport";
import { Users } from "../shared/firestoreTypes";

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

    const users = (
      await lunarAssistant.db.collection("root").doc("users").get()
    ).data() as Users;

    if (
      users.discordIds.includes(interaction.user.id) &&
      walletAddresses.length > 0
    ) {
      await interaction.reply({
        content: `Your registered wallets: ${walletAddresses.join(",")}`,
        ephemeral: true,
      });
    } else if (walletAddresses.length > 0) {
      await interaction.editReply({
        content:
          "Cannot display your wallet because you haven't activated Lunar Assistant for your Discordaccount yet. Please activate Lunar Assistant with /lunar-activate.",
      });
    } else {
      await interaction.editReply({
        content:
          "Cannot display your wallet because you haven't linked your wallet with Galactic Passport or activated Lunar Assistant for your Discord account. Please go to https://galacticpassport.com, log in with your Discord account, link your relevant wallets, and then run `/lunar-activate`.",
      });
    }
  },
};
