import axios, { AxiosInstance } from "axios";
import { PASSPORT_API_KEY } from "../../config.json";
import {
  LinkAccountBody,
  LinkedAccountsResponse,
  LinkedAddressesResponse,
} from "../types/passport";

const baseURL = "https://galactic-passport-server.herokuapp.com/v1";

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

    const wallets = res[discordId].wallets;

    if (wallets == undefined) {
      throw new Error("Wallets returned are undefined");
    }

    return wallets.map((walletObj) => walletObj.address);
  };

  // get discord id of wallet
  getDiscordIdByWallet = async (address: string): Promise<string> => {
    const res = (
      await this.passportClient.get(
        `/linked_accounts?platforms=discord&addresses=${address}`
      )
    ).data as LinkedAccountsResponse;

    if (res.accounts == undefined) {
      throw new Error("Accounts returned are undefined");
    }

    const discordId = res.accounts[0].accountId;
    return discordId;
  };

  // post requests

  // link address to discord id
  linkAddressToDiscordId = async (address: string, discordId: string) => {
    const body: LinkAccountBody = {
      platform_id: `discord_${discordId}`,
      address,
    };
    const res = await this.passportClient.post("/linked_accounts", body);
    return res;
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
