import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction } from "discord.js";
import { LunarAssistant } from "..";

export interface SlashCommandData {
  data: SlashCommandBuilder;
  execute: (
    lunarAssistant: LunarAssistant,
    interaction: CommandInteraction
  ) => Promise<void>;
}

export interface UpdateUserDiscordRolesResponse {
  addedRoleNames: { [guildName: string]: string[] };
  persistedRoleNames: { [guildName: string]: string[] };
  removedRoleNames: { [guildName: string]: string[] };
}

export interface RandomEarthUserItem {
  collection_addr: string;
  token_id: string;
  in_settlement: boolean;
}

export interface RandomEarthUserItems {
  items: RandomEarthUserItem[];
  total: number;
  page: number;
  pages: number;
}

export interface KnowhereUserItem {
  nftContract: string;
  tokenId: string;
}

export interface MessierArtUserItem {
  nft_contract: string;
  token_id: string;
}

export interface MessierArtUserItems {
  data: MessierArtUserItem[];
  page_no: number;
  item_count: number;
}

export interface ContractAddresses {
  nft: string[];
  cw20: string[];
  stakedNFT: string[];
}

export interface WalletContents {
  nft: {
    [nftAddress: string]: {
      tokenIds: string[];
    };
  };
  stakedNFT: {
    [stakedNFTAddress: string]: {
      tokenIds: string[];
    };
  };
  cw20: {
    [cw20Address: string]: {
      quantity: number;
    };
  };
}

export interface CustomAPIWalletAllowed {
  allowed: boolean;
}
