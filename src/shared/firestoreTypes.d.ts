export interface User {
  wallet: string;
}

export type NFTRule = {
  nftAddress: string;
  tokenIds?: string[];
  quantity: number;
  roleName: string;
};

export type GuildRule = {
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
export interface GuildConfig {
  rules: GuildRule[];
}
