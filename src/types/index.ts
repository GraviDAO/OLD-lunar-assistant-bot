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
  activeRoles: { [guildName: string]: string[] };
  removedRoles: { [guildName: string]: string[] };
}
