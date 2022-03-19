import axios from "axios";
import { CustomAPIWalletAllowed } from "../types";

export const getCustomAPIWalletAllowed = async (
  apiUrl: string,
  walletAddress: string
): Promise<boolean> => {
  let walletAllowedRes;
  const finalApiUrl: string = apiUrl.replace("$(wallet)", walletAddress);

  try {
    walletAllowedRes = (await axios.get(finalApiUrl))
      .data as CustomAPIWalletAllowed;

    return walletAllowedRes.allowed;
  } catch (e) {
    console.error(e);

    //return false so role update can continue
    return false;
  }
};
