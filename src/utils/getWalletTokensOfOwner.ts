import { terra } from "../services/terra";

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
    console.log(contractAddress, query_msg, res);
  } catch (e) {
    res = { tokens: [] };
  }
  return res;
};
