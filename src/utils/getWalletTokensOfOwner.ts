import { terra } from "../services/terra";
import { GetTokensResponse } from "../shared/contractTypes";

export const getWalletTokensOfOwner = async (
  owner: string,
  contractAddress: string
) => {
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
