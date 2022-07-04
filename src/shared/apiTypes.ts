export type ServerRule = {
    id: number,
    discordServerId: string,
    quantity: number,
    discordRole: string,
    apiUrl: string,
    createdAt: string,
    updatedAt: string,
    nftCollection: NftCollection,
  };

export type NftCollection = {
  id: number,
  name: string,
  description: string,
  symbol: string,
  address: string,
  numTokens: number,
  createdAt: string,
  updatedAt: string,
}

export type GetRulesResponse = {
  message: ServerRule[],
}