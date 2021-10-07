const { SlashCommandBuilder } = require("@discordjs/builders");
const { REST } = require("@discordjs/rest");
const { Routes } = require("discord-api-types/v9");
const { clientId, guildId, token } = require("../config.json");
console.log(token);

// TODO replace "Galactic Punk" with configuration option.

const commands = [
  new SlashCommandBuilder()
    .setName("lunar-link")
    .setDescription("Links a wallet to your discord account."),
  new SlashCommandBuilder()
    .setName("lunar-list-wallets")
    .setDescription("Lists the wallets connected to your discord account."),
  new SlashCommandBuilder()
    .setName("lunar-verify")
    .setDescription("Verifies your Galactic Punk Ownership."),
  new SlashCommandBuilder()
    .setName("my-tokens")
    .setDescription("Displays your Galactic Punk tokens."),
  new SlashCommandBuilder()
    .setName("lunar-configure")
    .setDescription("Configures the lunar assistant")(),
].map((command) => command.toJSON());

const rest = new REST({ version: "9" }).setToken(token);

rest
  .put(Routes.applicationGuildCommands(clientId, guildId), { body: commands })
  .then(() => console.log("Successfully registered application commands."))
  .catch(console.error);
