import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction } from "discord.js";
import db from "../services/admin";

export default {
  data: new SlashCommandBuilder()
    .setName("lunar-configure")
    .setDescription("Configures the lunar assistant")
    .setDefaultPermission(false)
    .addStringOption((option) =>
      option
        .setName("smart-contract-address")
        .setDescription(
          "The smart contract address of the nft collection you want to verify ownership of."
        )
        .setRequired(true)
    )
    .addRoleOption((option) =>
      option
        .setName("verified-role")
        .setDescription(
          "The role you want to give members who are verified to hold an nft from the specified nft collection."
        )
        .setRequired(true)
    ),
  execute: async (interaction: CommandInteraction) => {
    // verify the interaction is valid
    if (!interaction.guildId || !interaction.guild || !interaction.member)
      return;

    // configure the server settings
    const contractAddress = interaction.options.getString(
      "smart-contract-address"
    );
    const verifiedRole = interaction.options.getRole("verified-role");

    if (!contractAddress || !verifiedRole) return;

    // check if the bot role is above the verified role

    const lunarAssistantRole = interaction.guild.roles.cache.find(
      (role) => role.name == "Lunar Assistant"
    )!;

    interaction.guild.roles.cache.forEach((role) => {
      console.log(role.name, role.position);
    });
    if (verifiedRole.position > lunarAssistantRole.position) {
      await interaction.reply({
        content: `Please update the role hierarchy with 'Lunar Assistant' above of ${verifiedRole.name} and try again.`,
        ephemeral: true,
      });
      return;
    }

    const guildConfig: GuildConfig = {
      nftContractAddress: contractAddress,
      verifiedRoleName: verifiedRole.name,
    };

    // update the db
    await db
      .collection("guildConfigs")
      .doc(interaction.guildId)
      .set(guildConfig);

    // reply
    await interaction.reply({
      content: "Lunar Assistant configured successfully!",
      ephemeral: true,
    });
  },
};
