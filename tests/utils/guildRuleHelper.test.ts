import {
  APIRule,
  CW20Rule,
  GuildRule,
  SimpleRule,
} from "../../src/shared/firestoreTypes";
import {
  guildRuleToSimpleRule,
  isApiRule,
  isCW20Rule,
} from "../../src/utils/guildRuleHelpers";

test("convert api rule", () => {
  const roleId: string = "RoleId1";
  const url: string =
    "https://stations.levana.finance/api/factions/free-martians?wallet=terra18nxhzmg6733r93wes7d75udfmdhr9uze0ka4rd";
  const apiRule: GuildRule = {
    version: "1.0",
    nft: {},
    stakedNFT: {},
    cw20: {},
    api: { [url]: {} },
    nativeToken: {},
    roleId: roleId,
  };

  const sRule: SimpleRule = guildRuleToSimpleRule(apiRule);
  //console.log(`sRule.roleName: ${sRule.roleName}, (sRule as APIRule).apiUrl: ${(sRule as APIRule).apiUrl}`);
  expect(sRule.roleId).toBe(roleId);
  expect((sRule as APIRule).apiUrl).toEqual(url);
  expect(isApiRule(sRule)).toEqual(true);
});

test("verify IsCW20Rule true", () => {
  const rule: CW20Rule = {
    cw20Address: "terra1xj49zyqrwpv5k928jwfpfy2ha668nwdgkwlrg3",
    quantity: 1,
    roleId: "AstroHodler",
  };
  const res = isCW20Rule(rule);
  expect(res).toBe(true);
});
