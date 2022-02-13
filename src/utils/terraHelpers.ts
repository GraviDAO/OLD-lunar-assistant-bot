import { terra } from "../services/terra";
import { BalanceResponse, GetTokensResponse } from "../shared/contractTypes";

interface TalisResponse {
  tokens: { token_id: string }[];
}

export const getWalletTokensOfOwner = async (
  owner: string,
  contractAddress: string
): Promise<GetTokensResponse> => {
  // QUERY GAME STATUS

  let res: GetTokensResponse = { tokens: [] };

  let tokens: GetTokensResponse | undefined;
  try {
    do {
      const query = {
        tokens: {
          owner,
          limit: 30,
          start_after: tokens && tokens.tokens[tokens.tokens.length - 1],
        },
      };
      const queryResponse = (await terra.wasm.contractQuery(
        contractAddress,
        query
      )) as GetTokensResponse | TalisResponse;

      if (queryResponse.tokens.length > 0) {
        if (typeof queryResponse.tokens[0] == "string") {
          tokens = queryResponse as GetTokensResponse;
        } else {
          tokens = {
            tokens: (queryResponse as TalisResponse).tokens.map(
              (obj) => obj.token_id
            ),
          };
        }
      } else {
        tokens = { tokens: [] };
      }

      res.tokens.push(...tokens.tokens);
    } while (tokens.tokens.length == 30);
  } catch (e: any) {
    // console.error(e);
    console.error(
      `Couldn't query tokens for ${contractAddress}. Status code ${
        e?.response?.status
      }. Data: ${JSON.stringify(e?.response?.data)}`
    );
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
  } catch (e: any) {
    res = { balance: 0 };

    console.error(
      `Couldn't query tokens for ${contractAddress}. Status code ${e?.response?.status}`
    );
  }
  return res;
};
