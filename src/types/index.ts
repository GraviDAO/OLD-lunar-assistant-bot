import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction } from "discord.js";

export interface SlashCommandData {
  data: SlashCommandBuilder;
  execute: (interaction: CommandInteraction) => Promise<void>;
}
