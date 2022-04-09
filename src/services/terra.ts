import { LCDClient } from "@terra-money/terra.js";
import { LCDCClient_URL } from "../../config.json";

const LCDCClientConfig = {
  URL: LCDCClient_URL,
  chainID: `columbus-5`,
};

export const terra = new LCDClient(LCDCClientConfig);
