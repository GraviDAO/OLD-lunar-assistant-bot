import { terra } from "../services/terra";
import { BalanceResponse, GetTokensResponse } from "../shared/contractTypes";

export const getWalletTokensOfOwner = async (
  owner: string,
  contractAddress: string
): Promise<GetTokensResponse> => {
  // QUERY GAME STATUS
  const query_msg = {
    tokens: { owner },
  };

  let res: GetTokensResponse;

  try {
    res = await terra.wasm.contractQuery(contractAddress, query_msg);
  } catch (e) {
    res = { tokens: [] };
  }
  return res;
};

export const getCW20TokensOfWallet = async (
  address: string,
  contractAddress: string
): Promise<BalanceResponse> => {
  // QUERY GAME STATUS
  const query_msg = {
    balance: { address },
  };

  let res: BalanceResponse;

  try {
    res = await terra.wasm.contractQuery(contractAddress, query_msg);
  } catch (e) {
    res = { balance: 0 };
  }
  return res;
};
