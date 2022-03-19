import { GuildConfig, GuildRule } from "../../src/shared/firestoreTypes";
import { ContractAddresses } from "../../src/types";
import { getContractAddressesRelevantToGuildConfig } from "../../src/utils/getRelevantContractAddresses";

test("verify ApiRule is ignored", () => {
  const apiRule: GuildRule = {
    version: "1.0",
    nft: {},
    stakedNFT: {},
    cw20: {},
    api: {
      ["https://stations.levana.finance/api/factions/free-martians?wallet=$(wallet)"]:
        {},
    },
    nativeToken: {},
    roleId: "ApiRole",
  };

  const guildConfig: GuildConfig = { rules: [apiRule] };
  const contractAdresses: ContractAddresses =
    getContractAddressesRelevantToGuildConfig(guildConfig);
  expect(contractAdresses.nft.length).toBe(0);
  expect(contractAdresses.cw20.length).toBe(0);
});

test("verify cw20Rule is added", () => {
  const quantity = 1;
  const contractAddress = "terra1xj49zyqrwpv5k928jwfpfy2ha668nwdgkwlrg3";
  const cw20Rule: GuildRule = {
    version: "1.0",
    nft: {},
    stakedNFT: {},
    cw20: { [contractAddress]: { quantity } },
    api: {},
    nativeToken: {},
    roleId: "AstroHodler",
  };

  const guildConfig: GuildConfig = { rules: [cw20Rule] };
  const contractAdresses: ContractAddresses =
    getContractAddressesRelevantToGuildConfig(guildConfig);
  expect(contractAdresses.nft.length).toBe(0);
  expect(contractAdresses.cw20.length).toBe(1);
  expect(contractAdresses.cw20[0]).toBe(contractAddress);
});
