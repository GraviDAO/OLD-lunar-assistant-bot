import {
  APIRule,
  CW20Rule,
  GuildRule,
  NFTRule,
  SimpleRule,
} from "../shared/firestoreTypes";
import { WalletContents } from "../types";
import { getCustomAPIWalletAllowed } from "./getCustomAPIWalletAllowed";
import {
  guildRuleToSimpleRule,
  isApiRule,
  isNFTRule,
} from "./guildRuleHelpers";

export const checkRulesQualifies = async (
  guildRule: GuildRule,
  userTokensCache: WalletContents,
  walletAddress: string
) => {
  let rule: SimpleRule;
  try {
    rule = guildRuleToSimpleRule(guildRule);
  } catch (err) {
    console.error(
      `Couldn't convert to simple rule: ${JSON.stringify(guildRule)}`
    );
    return false;
  }

  let ruleQualifies: boolean = false;

  if (isNFTRule(rule)) {
    const nftRule = rule as NFTRule;
    const quantity = nftRule.quantity;
    const tokens = userTokensCache.nft[nftRule.nftAddress]?.tokenIds || [];

    // get the number of matching tokens
    const numMatchingTokens = (
      nftRule.tokenIds != undefined
        ? tokens.filter(
            (token) => nftRule.tokenIds && nftRule.tokenIds.includes(token)
          )
        : tokens
    ).length;

    if (numMatchingTokens >= quantity) {
      ruleQualifies = true;
    }
  } else if (isApiRule(rule)) {
    const apiRule = rule as APIRule;
    const customApiAllowed = await getCustomAPIWalletAllowed(
      apiRule.apiUrl,
      walletAddress
    );

    if (customApiAllowed) {
      ruleQualifies = true;
    }
  } else {
    const cw20Rule = rule as CW20Rule;
    const quantity = cw20Rule.quantity;

    const numTokens = userTokensCache.cw20[cw20Rule.cw20Address]?.quantity || 0;

    if (numTokens >= quantity) {
      ruleQualifies = true;
    }
  }

  return ruleQualifies;
};
