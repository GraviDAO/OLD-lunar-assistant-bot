import { REST } from "@discordjs/rest";
import { Routes } from "discord-api-types/v9";
import { Guild } from "discord.js";
import path from "path";
import { clientId, token } from "../../config.json";
import { commandFiles } from "./commandFiles";

export const registerCommands = async (guild: Guild) => {
  // delete already existing slash commands so that we can update them
  await Promise.all(
    guild.commands.cache.map(async (command) => {
      console.log("Deleting preexisting command:");
      console.log(command);
      await guild.commands.delete(command.id);
    })
  );

  // Check if an existing lunar commander role exists in the server
  const existingLunarCommanderRole = guild.roles.cache.find(
    (role) => role.name === "Lunar Commander"
  );

  // If no such role exists, create it
  const lunarCommanderRole = existingLunarCommanderRole
    ? existingLunarCommanderRole
    : await guild.roles.create({
        name: "Lunar Commander",
        color: "BLUE",
        reason: "Managing the lunar assistant.",
      });

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

  console.log("Successfully registered application commands.");

  // now update the permissions to allow for lunar commanders to configure the lunar assistant
  const permissions = [
    {
      id: lunarCommanderRole.id,
      type: "ROLE" as const,
      permission: true,
    },
  ];

  const registeredCommands = await guild.commands.fetch();

  // get the configured command
  const configureCommand = registeredCommands.find((command) => {
    return command.name == "lunar-configure";
  });

  // add the lunar command permission
  await configureCommand!.permissions.add({ permissions });
};
