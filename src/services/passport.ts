import axios, { AxiosInstance } from "axios";
import { PASSPORT_API_KEY } from "../../config.json";
import { LinkAccountBody, LinkedAddressesResponse } from "../types/passport";

const baseURL = "https://galactic-passport.herokuapp.com/v1";

interface PrimaryAccountsResponse {
  [address: string]: {
    primaryDiscord: string;
  };
}

class PassportAPI {
  passportClient: AxiosInstance;

  constructor() {
    this.passportClient = axios.create({
      baseURL,
      headers: {
        "X-GP-API-KEY": PASSPORT_API_KEY,
        "Content-Type": "application/json",
      },
    });
  }

  // get requests

  // get wallets of discord id
  getWalletsByDiscordId = async (discordId: string): Promise<string[]> => {
    const res = (
      await this.passportClient.get(
        `/linked_addresses?platform_ids=discord_${discordId}&onlyIfPrimaryAccount=true`
      )
    ).data as LinkedAddressesResponse;

    if (res[`discord_${discordId}`] == undefined) {
      return [];
    }

    const wallets = res[`discord_${discordId}`].wallets;

    if (wallets == undefined) {
      return [];
    }

    return wallets.map((walletObj) => walletObj.address);
  };

  // get discord id of wallet
  getDiscordIdByWallet = async (address: string): Promise<string> => {
    const res = (
      await this.passportClient.get(
        `/primary_accounts?platforms=discord&addresses=${address}`
      )
    ).data as PrimaryAccountsResponse;

    if (
      res[address] == undefined ||
      res[address]["primaryDiscord"] == undefined
    ) {
      throw new Error("Can't find discord ID");
    }

    const discordId = res[address]["primaryDiscord"];
    return discordId;
  };

  // post requests

  // link address to discord id
  linkAddressToDiscordId = async (address: string, discordId: string) => {
    const body: LinkAccountBody = {
      platform_id: `discord_${discordId}`,
      address,
      setAsPrimaryAccount: true,
      setAsPrimaryAddress: true,
    };
    try {
      const res = await this.passportClient.post("/linked_accounts", body);
      return res;
    } catch (error: any) {
      if (error.response) {
        console.error(error.response.data);
      } else {
        console.error(error);
      }
      throw new Error("Couldn't link address to discord id");
    }
  };

  unlinkAddressFromDiscord = async (address: string) => {
    // first get the user's discord id
    const discordId = await this.getDiscordIdByWallet(address);

    const res = await this.passportClient.delete(
      `/linked_accounts/discord_${discordId}/linked_addresses/${address}`
    );
    return res;
  };
}

const passportApi = new PassportAPI();

export { passportApi, PassportAPI };
