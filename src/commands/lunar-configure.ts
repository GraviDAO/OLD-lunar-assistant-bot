import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction, MessageAttachment } from "discord.js";
import { LunarAssistant } from "..";
import db from "../services/admin";
import { GuildConfig, GuildRule } from "../shared/firestoreTypes";
import { guildRuleToSimpleRule } from "../utils/guildRuleHelpers";

export default {
  data: new SlashCommandBuilder()
    .setName("lunar-configure")
    .setDescription("Configures the lunar assistant")
    .setDefaultPermission(false)
    .addSubcommand((subcommand) =>
      subcommand
        .setName("add-nft-rule")
        .setDescription(
          "Adds a rule for granting a role to users based on nft ownership."
        )
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
              "The quantity of matching nfts that a user must hold in order to meet the rule."
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
        .setName("add-cw20-rule")
        .setDescription(
          "Adds a rule for granting a role to users based on cw20 ownership."
        )
        .addStringOption((option) =>
          option
            .setName("cw20-address")
            .setDescription(
              "The contract address against which to check for cw20 ownership for this rule."
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
              "The quantity of matching cw20 tokens that a user must hold in order to meet the rule."
            )
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("view-rules")
        .setDescription("View the rules currently configured for the server.")
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("remove-rule")
        .setDescription(
          "Remove a rule based on its index in the output of `/list-rules`"
        )
        .addNumberOption((option) =>
          option
            .setName("rule-number")
            .setDescription("The index of the rule to remove.")
            .setRequired(true)
        )
    ),
  execute: async (
    lunarAssistant: LunarAssistant,
    interaction: CommandInteraction
  ) => {
    // verify the interaction is valid
    if (!interaction.guildId || !interaction.guild || !interaction.member)
      return;

    if (interaction.options.getSubcommand() === "add-nft-rule") {
      // configure the server settings
      const nftAddress = interaction.options.getString("nft-address");
      const role = interaction.options.getRole("role");
      const rawQuantity = interaction.options.getNumber("quantity");
      const rawTokenIds = interaction.options.getString("token-ids");

      // verify that nftAddress and role are defined
      if (!nftAddress || !role) {
        await interaction.reply({
          content: "Could not get nftAddress or role",
          ephemeral: true,
        });
        return;
      }

      // verify that we can parse tokenIds
      let tokenIds;
      try {
        tokenIds = rawTokenIds ? JSON.parse(rawTokenIds) : undefined;
        // check that the tokenIds is properly formatted
        if (
          tokenIds &&
          !(
            Array.isArray(tokenIds) &&
            tokenIds.every((tokenId) => typeof tokenId == "string")
          )
        ) {
          throw new Error("Token ids are not an array of strings");
        }
      } catch {
        await interaction.reply({
          content:
            'Could not parse token ids, please pass token ids in the following format: ["1", "2", "4"]',
          ephemeral: true,
        });
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
            // only include tokenIds if defined
            ...(tokenIds && { tokenIds }),
            quantity,
          },
        },
        cw20: {},
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
    } else if (interaction.options.getSubcommand() === "add-cw20-rule") {
      // configure the server settings
      const cw20Address = interaction.options.getString("cw20-address");
      const role = interaction.options.getRole("role");
      const rawQuantity = interaction.options.getNumber("quantity");

      // verify that nftAddress and role are defined
      if (!cw20Address || !role) {
        await interaction.reply({
          content: "Could not get cw20Address or role",
          ephemeral: true,
        });
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
        nft: {},
        cw20: {
          [cw20Address]: {
            quantity,
          },
        },
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
    } else if (interaction.options.getSubcommand() === "view-rules") {
      const guildConfigDoc = await db
        .collection("guildConfigs")
        .doc(interaction.guildId)
        .get();

      if (!guildConfigDoc.exists) {
        await interaction.reply({
          content:
            "You haven't created any rules yet. Please run `/rule-add` and try again",
          ephemeral: true,
        });
        return;
      }

      const guildConfigRules = (guildConfigDoc.data() as GuildConfig).rules;

      const rulesMessage = guildConfigRules
        .map((guildRule, index) => {
          try {
            const simpleRule = guildRuleToSimpleRule(guildRule);

            const ruleString = JSON.stringify(simpleRule);

            const ruleDisplay = ruleString;
            // ruleString.length > ruleDisplayMaxLength
            //   ? ruleString.substr(0, ruleDisplayMaxLength) + "..."
            //   : ruleString;

            return `Rule ${index}: ${JSON.stringify(ruleDisplay)}\n`;
          } catch (err) {
            return `Malformed rule: ${JSON.stringify(guildRule)}\n`;
          }
        })
        .join("\n");

      // reply with list of configured rules
      await interaction.reply({
        content: "Your configured rules are attached!",
        ephemeral: true,
        files: [
          new MessageAttachment(
            Buffer.from(rulesMessage),
            `lunar-assistant-rules.txt`
          ),
        ],
      });
    } else if (interaction.options.getSubcommand() === "remove-rule") {
      const ruleNumber = interaction.options.getNumber("rule-number");

      if (ruleNumber == undefined) {
        await interaction.reply({
          content: "Please specify a rule number and try again",
          ephemeral: true,
        });
        return;
      }

      const guildConfigDoc = await db
        .collection("guildConfigs")
        .doc(interaction.guildId)
        .get();

      if (!guildConfigDoc.exists) {
        await interaction.reply({
          content:
            "You haven't created any rules yet. Please run `/rule-add` and try again",
          ephemeral: true,
        });
        return;
      }

      // configure guild config
      const guildConfig = guildConfigDoc.data() as GuildConfig;

      if (guildConfig.rules.length <= ruleNumber) {
        await interaction.reply({
          content: `Rule number is out of bounds. Please enter a rule number in the range 0-${
            guildConfig.rules.length - 1
          }`,
          ephemeral: true,
        });
        return;
      }

      guildConfig.rules.splice(ruleNumber, 1);

      // update the db
      await db
        .collection("guildConfigs")
        .doc(interaction.guildId)
        .set(guildConfig);

      // reply
      await interaction.reply({
        content: "Rule removed successfully!",
        ephemeral: true,
      });
    }
  },
};
