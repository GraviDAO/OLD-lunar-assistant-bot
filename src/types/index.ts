import { ContextMenuCommandBuilder, SlashCommandBuilder } from "@discordjs/builders";
import { ModalSubmitInteraction } from "discord-modals";
import { ButtonInteraction, CommandInteraction, ContextMenuInteraction } from "discord.js";
import { LunarAssistant } from "..";

export interface SlashCommandData {
  data: SlashCommandBuilder;
  execute: (
    lunarAssistant: LunarAssistant,
    interaction: CommandInteraction
  ) => Promise<void>;
}

export interface ContextMenuData {
  data: ContextMenuCommandBuilder,
  execute: (
    lunarAssistant: LunarAssistant,
    interaction: ContextMenuInteraction
    ) => Promise<void>;
}

export interface ButtonData {
  customId: string;
  execute: (
    lunarAssistant: LunarAssistant,
    interaction: ButtonInteraction
    ) => Promise<void>;
}

export interface ModalData {
  customId: string;
  execute: (
    lunarAssistant: LunarAssistant,
    interaction: ModalSubmitInteraction
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
