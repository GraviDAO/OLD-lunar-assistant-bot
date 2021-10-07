import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction, GuildMemberRoleManager } from "discord.js";
import db from "../services/admin";
import { getTokensOfOwner } from "../utils/getTokensOfOwner";

const lunarVerify = {
  data: new SlashCommandBuilder()
    .setName("lunar-verify")
    .setDescription("Verifies your Galactic Punk Ownership."),
  execute: async (interaction: CommandInteraction) => {
    // verify the interaction is valid
    if (!interaction.guildId || !interaction.guild || !interaction.member)
      return;

    // get the user document
    const userDoc = await db.collection("users").doc(interaction.user.id).get();
    const guildDoc = await db
      .collection("guildConfigs")
      .doc(interaction.guildId)
      .get();

    // check if the guild doc exists
    if (!guildDoc.exists) {
      await interaction.reply({
        content: "Lunar assistant has not been configured yet",
        ephemeral: true,
      });
      return;
    }

    const guildConfig = guildDoc.data() as GuildConfig;

    const role = interaction.guild.roles.cache.find(
      (role) => role.name == guildConfig.verifiedRoleName
    );

    if (!role) return;

    if (userDoc.exists) {
      const wallets = (userDoc.data() as User).wallets;

      // "terra13ed80hm5ay0c2fjcwstg6ca7973w2wz85fffqp"
      const res = await getTokensOfOwner(
        wallets[0],
        // "terra1qtqynxctnef434pnaggqkl9yh3lyzqyz53xlqu",
        guildConfig.nftContractAddress
      );
      console.log(res);

      if (res.tokens.length > 0) {
        try {
          await (interaction.member.roles as GuildMemberRoleManager).add(role);

          await interaction.reply(
            `You are now verified! Welcome to the Galactic Punks :)`
          );
        } catch (e) {
          await interaction.reply(
            "Permissions error, please make sure that the lunar assistant role is at the top of the role hierarchy."
          );
        }
      } else {
        await (interaction.member.roles as GuildMemberRoleManager).remove(role);
        await interaction.reply(`You don't have any galactic punks...`);
      }
    } else {
      await interaction.reply("Please verify your wallet address first");
    }
  },
};

export default lunarVerify;
