import axios, { AxiosInstance } from "axios";
import { PASSPORT_API_KEY } from "../../config.json";
import {
  LinkAccountBody,
  LinkedAccountsResponse,
  LinkedAddressesResponse,
} from "../types/passport";

const baseURL = "https://galactic-passport-server.herokuapp.com/v1";

export default class PassportAPI {
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
  getWalletsByDiscordId = async (discordId: string) => {
    const res = (
      await this.passportClient.get(
        `/linked_addresses?platform_ids=discord_${discordId}`
      )
    ).data as LinkedAddressesResponse;

    return res[discordId].wallets;
  };

  // get discord id of wallet
  getDiscordIdByWallet = async (address: string) => {
    const res = (
      await this.passportClient.get(
        `/linked_accounts?platforms=discord&addresses=${address}`
      )
    ).data as LinkedAccountsResponse;

    return res.accounts;
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
}
