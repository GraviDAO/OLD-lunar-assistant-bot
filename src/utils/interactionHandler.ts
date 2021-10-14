import { Collection, Interaction } from "discord.js";
import path from "path";
import { LunarAssistant } from "..";
import { SlashCommandData } from "../types";
import { commandFiles } from "./commandFiles";

// Create a collection for the command handles
const commandHandlers = new Collection<string, SlashCommandData>();

// Populate the command handlers collection
for (const file of commandFiles) {
  const commandFilePath = path.resolve(__dirname, `../commands/${file}`);
  const command = require(commandFilePath).default;

  // Set a new item in the Collection
  // With the key as the command name and the value as the exported module
  commandHandlers.set(command.data.name, command);
}

export async function interactionHandler(
  this: LunarAssistant,
  interaction: Interaction
) {
  if (!interaction.isCommand()) return;

  // get the command handler
  const command = commandHandlers.get(interaction.commandName);

  if (!command) return;

  // try to run the command handler
  try {
    console.log(this.db);
    await command.execute(this, interaction);
  } catch (error) {
    console.error(error);
    await interaction.reply({
      content: "There was an error while executing this command!",
      ephemeral: true,
    });
  }
}
