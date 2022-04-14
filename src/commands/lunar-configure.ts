import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction, MessageAttachment } from "discord.js";
import { LunarAssistant } from "..";
import db from "../services/admin";
import { GuildConfig, GuildRule } from "../shared/firestoreTypes";
import {
  guildRuleToSimpleRule,
  simpleRuleToHumanSimpleRule,
} from "../utils/guildRuleHelpers";
import { isValidHttpUrl } from "../utils/helper";

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
        .setName("add-staked-nft-rule")
        .setDescription(
          "Adds a rule for granting a role to users based on nft staking."
        )
        .addStringOption((option) =>
          option
            .setName("staked-nft-address")
            .setDescription(
              "The contract address against which to check for nft staking for this rule."
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
        .setName("add-api-rule")
        .setDescription(
          "Adds a rule for granting a role to a user based on the response of your custom API."
        )
        .addStringOption((option) =>
          option
            .setName("api-url")
            .setDescription(
              "Format: 'https://yourApiUrl.com?wallet=$(wallet)' $(wallet) will be replaced by user wallet address"
            )
            .setRequired(true)
        )
        .addRoleOption((option) =>
          option
            .setName("role")
            .setDescription("The role to give to users which meet this rule.")
            .setRequired(true)
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
      const nftAddress = interaction.options.getString("nft-address")?.toLowerCase();
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

      if(nftAddress.length != 44 || !nftAddress.startsWith("terra",0)) {
        await interaction.reply({
          content: "Invalid terra address",
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
          'Could not parse token ids, please pass token ids in the following format: ["1", "2", "4"] and if it is a single entry write ["#"] and make sure to use the "-sign and not the similar looking “-sign!!! Write ["#"] not [“#“].',
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
        stakedNFT: {},
        cw20: {},
        api: {},
        nativeToken: {},
        roleId: role.id,
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
    } else if (interaction.options.getSubcommand() === "add-staked-nft-rule") {
      // configure the server settings
      const nftAddress = interaction.options.getString("staked-nft-address")?.toLowerCase();
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

      if(nftAddress.length != 44 || !nftAddress.startsWith("terra",0)) {
        await interaction.reply({
          content: "Invalid terra address",
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
            'Could not parse token ids, please pass token ids in the following format: ["1", "2", "4"] and if it is a single entry write ["#"] and make sure to use the "-sign and not the similar looking “-sign!!! Write ["#"] not [“#“].',
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
        stakedNFT: {
          [nftAddress]: {
            // only include tokenIds if defined
            ...(tokenIds && { tokenIds }),
            quantity,
          },
        },
        cw20: {},
        api: {},
        nativeToken: {},
        roleId: role.id,
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
      const cw20Address = interaction.options.getString("cw20-address")?.toLowerCase();
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

      if(cw20Address.length != 44 || !cw20Address.startsWith("terra",0)) {
        await interaction.reply({
          content: "Invalid terra address",
          ephemeral: true,
        });
        return;
      }

      const quantity = rawQuantity ? rawQuantity : 1;

      // Check if the bot role is above the verified role
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
        stakedNFT: {},
        cw20: {
          [cw20Address]: {
            quantity,
          },
        },
        api: {},
        nativeToken: {},
        roleId: role.id,
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
    } else if (interaction.options.getSubcommand() === "add-api-rule") {
      // configure the server settings
      const apiUrl = interaction.options.getString("api-url");
      const role = interaction.options.getRole("role");

      // verify that nftAddress and role are defined
      if (!apiUrl || !role) {
        await interaction.reply({
          content: "Could not get api-url or role",
          ephemeral: true,
        });
        return;
      } else if (!isValidHttpUrl(apiUrl)) {
        //Verify url is valid
        await interaction.reply({
          content: "api-url is not a valid url",
          ephemeral: true,
        });
        return;
      }

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
        stakedNFT: {},
        cw20: {},
        api: {
          [apiUrl]: {},
        },
        nativeToken: {},
        roleId: role.id,
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
      if (!interaction.guildId || !interaction.guild || !interaction.member)
        return;

      let guild = interaction.guild;

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

      const res: any = {};

      guildConfigRules.forEach((guildRule, index) => {
        try {
          const simpleRule = guildRuleToSimpleRule(guildRule);

          let roleName = guild.roles.cache.find(
            (role) => role.id == simpleRule.roleId
          )?.name;

          const humanSimpleRule = simpleRuleToHumanSimpleRule(
            simpleRule,
            roleName ||
              "unknown: Role has been deleted since creating the rule."
          );

          res[`rule-${index}`] = humanSimpleRule;
        } catch (err) {
          res[`rule-${index}`] = guildRule;
        }
      });

      // reply with list of configured rules
      await interaction.reply({
        content: "Your configured rules are attached!",
        ephemeral: true,
        files: [
          new MessageAttachment(
            Buffer.from(JSON.stringify(res, null, 4)),
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
