import { terra } from "../services/terra";

export const getTokensOfOwner = async (
  owner: string,
  contractAddress: string
) => {
  // QUERY GAME STATUS
  const query_msg = {
    tokens: { owner },
  };
  console.log(contractAddress, query_msg);

  let res: GetTokensResponse;
  try {
    res = await terra.wasm.contractQuery(contractAddress, query_msg);
  } catch (e) {
    res = { tokens: [] };
  }
  return res;
};
