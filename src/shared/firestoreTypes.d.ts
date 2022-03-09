export interface User {
  wallet: string;
}

export type NFTRule = {
  nftAddress: string;
  tokenIds?: string[];
  quantity: number;
  roleId: string;
};

export type CW20Rule = {
  cw20Address: string;
  quantity: number;
  roleId: string;
};

export type SimpleRule = NFTRule | CW20Rule;

export type HumanNFTRule = {
  nftAddress: string;
  tokenIds?: string[];
  quantity: number;
  roleName: string;
};

export type HumanCW20Rule = {
  cw20Address: string;
  quantity: number;
  roleName: string;
};

export type HumanSimpleRule = HumanNFTRule | HumanCW20Rule;

// GuildRule is designed to accomodate future rule types.
// For now "nativeToken" is never used.
// And nft and token are never both populated in the same rule.
export type GuildRule = {
  version: string;
  nft: {
    [nftAddress: string]: {
      tokenIds?: string[];
      quantity: number;
    };
  };
  cw20: {
    [cw20Address: string]: {
      quantity: number;
    };
  };
  nativeToken: {
    [denom: string]: {
      quantity: number;
    };
  };
  roleId: string;
};
export interface GuildConfig {
  rules: GuildRule[];
}

export type OldGuildRule = {
  version: string;
  nft: {
    [nftAddress: string]: {
      tokenIds?: string[];
      quantity: number;
    };
  };
  cw20: {
    [cw20Address: string]: {
      quantity: number;
    };
  };
  nativeToken: {
    [denom: string]: {
      quantity: number;
    };
  };
  roleName: string;
};
export interface OldGuildConfig {
  rules: OldGuildRule[];
}
