import { REST } from "@discordjs/rest";
import { Routes } from "discord-api-types/v9";
import { Guild } from "discord.js";
import path from "path";
import { clientId, token } from "../../config.json";
import { commandFiles } from "./commandFiles";

export const registerCommands = async (guild: Guild) => {

  // get the list of new commands
  const newCommands = commandFiles.map((file) => {
    const commandFilePath = path.resolve(__dirname, `../commands/${file}`);
    const command = require(commandFilePath).default;
    return command.data.toJSON();
  });

  // register the commands
  const rest = new REST({ version: "9" }).setToken(token);

  await rest.put(Routes.applicationGuildCommands(clientId, guild.id) as any, {
    body: newCommands,
  });

  console.log(`Successfully registered application commands for ${guild.name}`);
};


