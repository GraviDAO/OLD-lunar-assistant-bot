import {
  CW20Rule,
  GuildConfig,
  GuildRule,
  NFTRule,
  SimpleRule,
  APIRule,
} from "../shared/firestoreTypes";
import { UpdateUserDiscordRolesResponse } from "../types";
import { getRelevantContractAddresses } from "./getRelevantContractAddresses";
import { getWalletContents } from "./getWalletContents";
import {
  guildRuleToSimpleRule,
  isNFTRule,
  isApiRule,
} from "./guildRuleHelpers";
import { getCustomAPIWalletAllowed } from "./getCustomAPIWalletAllowed";

export async function dryUpdateDiscordRolesForUser(
  walletAddress: string,
  // userDoc: FirebaseFirestore.DocumentSnapshot<FirebaseFirestore.DocumentData>,
  guildConfigsSnapshot: FirebaseFirestore.QuerySnapshot<FirebaseFirestore.DocumentData>
): Promise<UpdateUserDiscordRolesResponse> {
  // get the users wallet address

  // mapping from discord server name to a list of active roles
  const activeRoles: { [guildName: string]: string[] } = {};

  // mapping from discord server name to a list of roles being removed
  const removedRoles: { [guildName: string]: string[] } = {};

  const relevantContractAddresses =
    getRelevantContractAddresses(guildConfigsSnapshot);

  const userTokensCache = await getWalletContents(
    walletAddress,
    relevantContractAddresses
  );

  console.log(
    Object.keys(userTokensCache.nft)
      .map((key) => ({
        address: key,
        count: userTokensCache.nft[key].tokenIds.length,
      }))
      .filter((info) => info.count > 0)
  );

  // update roles for user in guild
  const coldUpdateDiscordRolesForUserInGuild = async (
    guildConfigDoc: FirebaseFirestore.DocumentSnapshot<FirebaseFirestore.DocumentData>
  ) => {
    // update roles for user in guild according to a specific rule
    const coldUpdateDiscordRolesForUserInGuildRule = async (
      guildRule: GuildRule
    ) => {
      // for now we are only handling a single nft rule
      // build the single NFT rule

      let rule: SimpleRule;
      try {
        rule = guildRuleToSimpleRule(guildRule);
      } catch (err) {
        console.error("Couldn't convert to simple rule");
        return;
      }

      // set numMatchingTokens
      let numMatchingTokens: number;
      let customApiAllowed: boolean;
      let quantity: number;
      if (isNFTRule(rule)) {
        const nftRule = rule as NFTRule;
        quantity = nftRule.quantity;
        customApiAllowed = false;

        const tokens = userTokensCache.nft[nftRule.nftAddress]?.tokenIds || [];

        // get the number of matching tokens
        numMatchingTokens = (
          nftRule.tokenIds != undefined
            ? tokens.filter(
                (token) => nftRule.tokenIds && nftRule.tokenIds.includes(token)
              )
            : tokens
        ).length;
      } else if (isApiRule(rule)) {
        const apiRule = rule as APIRule;
        customApiAllowed = await getCustomAPIWalletAllowed(
          apiRule.apiUrl,
          walletAddress
        );
        numMatchingTokens = 0;
        quantity = Number.MAX_SAFE_INTEGER; //not used for apiRule
      } else {
        const cw20Rule = rule as CW20Rule;
        quantity = cw20Rule.quantity;

        const numTokens =
          userTokensCache.cw20[cw20Rule.cw20Address]?.quantity || 0;

        numMatchingTokens = numTokens;
        customApiAllowed = false;
      }

      if (
        (numMatchingTokens >= quantity || customApiAllowed) &&
        // don't duplicate role if it was already granted
        !(
          activeRoles[guildConfigDoc.id] &&
          activeRoles[guildConfigDoc.id].includes(rule.roleId)
        )
      ) {
        // the user matches the role rules, update accordingly

        // update activeRoles
        if (activeRoles[guildConfigDoc.id]) {
          activeRoles[guildConfigDoc.id].push(rule.roleId);
        } else {
          activeRoles[guildConfigDoc.id] = [rule.roleId];
        }
      }
    };

    // loop through each of the rules registered with the guild in sequence
    await (guildConfigDoc.data() as GuildConfig).rules.reduce(
      (p, guildRule) => {
        return p.then(() =>
          coldUpdateDiscordRolesForUserInGuildRule(guildRule)
        );
      },
      new Promise((resolve) => resolve(null))
    );
  };

  // loop through guilds registered with lunar assistant in sequence
  await guildConfigsSnapshot.docs.reduce((p, guildConfigDoc) => {
    return p.then(async () => {
      await coldUpdateDiscordRolesForUserInGuild(guildConfigDoc);
    });
  }, new Promise((resolve, reject) => resolve(null)));

  console.log(`Got all tokens and updated roles for ${walletAddress}:`, {
    activeRoles,
    removedRoles,
  });

  // return the list of the users active roles and removed roles
  return { activeRoles, removedRoles };
}
