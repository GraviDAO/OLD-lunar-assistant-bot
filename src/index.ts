import { Client, Collection, Intents } from "discord.js";
import path from "path";
import { token } from "../config.json";
import db from "./services/admin";
import { SlashCommandData } from "./types";
import { commandFiles } from "./utils/commandFiles";
import { registerCommands } from "./utils/registerCommands";
import { updateDiscordRolesForUser } from "./utils/updateDiscordRolesForUser";

// Create a new client instance
const client = new Client({ intents: [Intents.FLAGS.GUILDS] });

// When the client is ready, run this code (only once)
client.once("ready", () => {
  console.log("Ready!");
});

// When the bot is added to a server, configure the slash commands
client.on("guildCreate", registerCommands);

// Create a collection for the command handles
const commandHandlers = new Collection<string, SlashCommandData>();

// Populate the command handlers collection
for (const file of commandFiles) {
  const commandFilePath = path.resolve(__dirname, `./commands/${file}`);
  const command = require(commandFilePath).default;

  // Set a new item in the Collection
  // With the key as the command name and the value as the exported module
  commandHandlers.set(command.data.name, command);
}

// handle slash command interactions
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isCommand()) return;

  // get the command handler
  const command = commandHandlers.get(interaction.commandName);

  if (!command) return;

  // try to run the command handler
  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(error);
    await interaction.reply({
      content: "There was an error while executing this command!",
      ephemeral: true,
    });
  }
});

db.collection("users").onSnapshot((querySnapshot) => {
  querySnapshot.docChanges().forEach((change) => {
    updateDiscordRolesForUser(client, change.doc.id);
  });
});

// Login to Discord with your client's token
client.login(token);
