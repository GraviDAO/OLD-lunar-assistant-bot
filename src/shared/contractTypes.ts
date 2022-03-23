export interface GetTokensResponse {
  tokens: string[];
}

export type StakedNFTsByAddressResponse = {
  stake: {
    token_id: string;
  };
}[];

export interface BalanceResponse {
  balance: number;
}

export const stakedNFTsByAddressResponseToGetTokensResponse = (
  res: StakedNFTsByAddressResponse
) => {
  return {
    tokens: res.map((stakedNFT) => stakedNFT.stake.token_id),
  };
};
