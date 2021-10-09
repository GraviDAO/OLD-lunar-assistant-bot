interface User {
  wallet: string;
  activeRoles: { [guildName: string]: string[] };
}

type NFTRule = {
  nftAddress: string;
  tokenIds?: string[];
  quantity: number;
  roleName: string;
};

type GuildRule = {
  version: string;
  nft: {
    [nftAddress: string]: {
      tokenIds?: string[];
      quantity: number;
    };
  };
  token: {
    [tokenAddress: string]: {
      quantity: string;
    };
  };
  nativeToken: {
    [denom: string]: {
      quantity: number;
    };
  };
  roleName: string;
};
interface GuildConfig {
  rules: GuildRule[];
}
