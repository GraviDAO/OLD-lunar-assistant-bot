import { terra } from "../services/terra";
import { BalanceResponse, GetTokensResponse } from "../shared/contractTypes";

export const getWalletTokensOfOwner = async (
  owner: string,
  contractAddress: string
): Promise<GetTokensResponse> => {
  // QUERY GAME STATUS

  let res: GetTokensResponse = { tokens: [] };

  let tokens: GetTokensResponse | undefined;
  try {
    do {
      tokens = (await terra.wasm.contractQuery(contractAddress, {
        owner,
        limit: 30,
        start_after: tokens && tokens.tokens.at(-1),
      })) as GetTokensResponse;

      res.tokens.push(...tokens.tokens);
    } while (tokens.tokens.length == 30);
  } catch (e) {}
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
