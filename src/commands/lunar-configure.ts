import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction } from "discord.js";
import db from "../services/admin";

export default {
  data: new SlashCommandBuilder()
    .setName("lunar-configure")
    .setDescription("Configures the lunar assistant")
    .setDefaultPermission(false)
    .addSubcommand((subcommand) =>
      subcommand
        .setName("add-rule")
        .setDescription("Adds a rule for granting a role to users.")
        .addStringOption((option) =>
          option
            .setName("nft-address")
            .setDescription(
              "The contract address against which to check for nft ownership for this rule."
            )
            .setRequired(true)
        )
        .addRoleOption((option) =>
          option
            .setName("role")
            .setDescription("The role to give to users which meet this rule.")
            .setRequired(true)
        )
        .addNumberOption((option) =>
          option
            .setName("quantity")
            .setDescription(
              "The quantity of matching nfts that a user must hold in order to meet the rule.  "
            )
        )
        .addStringOption((option) =>
          option
            .setName("token-ids")
            .setDescription(
              "A list of token ids that the rule is restricted to."
            )
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("list-rules")
        .setDescription("List the rules currently configured for the server.")
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("remove-rule")
        .setDescription(
          "Remove a rule based on its index in the output of `/list-rules`"
        )
        .addIntegerOption((option) =>
          option
            .setName("rule-number")
            .setDescription("The index of the rule to remove.")
        )
    ),
  execute: async (interaction: CommandInteraction) => {
    // verify the interaction is valid
    if (!interaction.guildId || !interaction.guild || !interaction.member)
      return;

    if (interaction.options.getSubcommand() === "add-rule") {
      // configure the server settings
      const nftAddress = interaction.options.getString("nft-address");
      const role = interaction.options.getRole("role");
      const rawQuantity = interaction.options.getInteger("quantity");
      const rawTokenIds = interaction.options.getString("token-ids");

      // verify that nftAddress and role are defined
      if (!nftAddress || !role) {
        await interaction.reply("Could not get nftAddress or role");
        return;
      }

      // verify that we can parse tokenIds
      let tokenIds;
      try {
        tokenIds = rawTokenIds ? JSON.parse(rawTokenIds) : undefined;
      } catch {
        await interaction.reply("Could not parse token ids");
        return;
      }

      const quantity = rawQuantity ? rawQuantity : 1;

      // check if the bot role is above the verified role
      const lunarAssistantRole = interaction.guild.roles.cache.find(
        (role) => role.name == "Lunar Assistant"
      )!;

      if (role.position > lunarAssistantRole.position) {
        await interaction.reply({
          content: `Please update the role hierarchy with 'Lunar Assistant' above of ${role.name} and try again.`,
          ephemeral: true,
        });
        return;
      }

      const newRule: GuildRule = {
        version: "1.0",
        nft: {
          [nftAddress]: {
            tokenIds,
            quantity,
          },
        },
        token: {},
        nativeToken: {},
        roleName: role.name,
      };

      const guildConfigDoc = await db
        .collection("guildConfigs")
        .doc(interaction.guildId)
        .get();

      const guildConfig: GuildConfig = guildConfigDoc.exists
        ? (guildConfigDoc.data() as GuildConfig)
        : { rules: [] };

      guildConfig.rules.push(newRule);

      // update the db
      await db
        .collection("guildConfigs")
        .doc(interaction.guildId)
        .set(guildConfig);

      // reply
      await interaction.reply({
        content: "Rule added successfully!",
        ephemeral: true,
      });
    } else if (interaction.options.getSubcommand() === "list-rules") {
    } else if (interaction.options.getSubcommand() === "remove-rule") {
    }
  },
};
