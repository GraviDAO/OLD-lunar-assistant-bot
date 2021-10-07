import { LCDClient } from "@terra-money/terra.js";

const LCDCClientConfig = {
  URL: `https://fcd.terra.dev`,
  chainID: `columbus-5`,
};

export const terra = new LCDClient(LCDCClientConfig);
