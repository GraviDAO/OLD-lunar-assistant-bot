import { Client, Collection, Intents } from "discord.js";
import cron from "node-cron";
import path from "path";
import { token } from "../config.json";
import db from "./services/admin";
import { SlashCommandData } from "./types";
import { commandFiles } from "./utils/commandFiles";
import { registerCommands } from "./utils/registerCommands";
import {
  coldUpdateDiscordRolesForUser,
  updateDiscordRolesForUser,
} from "./utils/updateDiscordRolesForUser";

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

// update discord roles whenever a user document changes
db.collection("users").onSnapshot((querySnapshot) => {
  querySnapshot.docChanges().forEach((change) => {
    try {
      updateDiscordRolesForUser(client, change.doc.id);
    } catch (e) {
      console.error(e);
    }
  });
});

// cronjob to update discord roles once a day
cron.schedule("0 8 * * *", async () => {
  // read all users from firestore
  // read all serverConfigs from firestore
  // for each user in users (in memory)
  //   for each serverConfig in serverConfigs (in memory)
  //     check if the user is in the server (in memory), if so:
  //       for each rule in serverConfig (in memory)
  //         query the user tokens relevant to the rule (cache if possible)
  //         update user's discord roles according to rule
  //         save the user's discord roles to firestore

  // loop over every user
  const usersSnapshot = await db.collection("users").get();
  const guildConfigsSnapshot = await db.collection("guildConfigs").get();

  await usersSnapshot.docs.reduce(
    (p, userDoc) =>
      p
        .then(() =>
          // update the user's discord roles
          {
            try {
              coldUpdateDiscordRolesForUser(
                client,
                userDoc.id,
                userDoc,
                guildConfigsSnapshot
              );
            } catch (e) {
              console.error(e);
            }
          }
        )
        .then(
          // delay for one second between processing each user
          () => new Promise((resolve) => setTimeout(() => resolve(null), 1000))
        ),
    new Promise((resolve, reject) => resolve(null))
  );
});

// start the discord bot
client.login(token);

// thinking about cronjobs and things:
// there is also the approach of a user coming online
// upside is seemingly realtime
// and distributed load based on people going online / offline
// downside is that it is potentially a higher load
// each time user comes online, call updateDiscordRolesForUser
// cache the responses for a couple hours so that people won't be updated many times a day
// updateDiscordRolesForUser
// read user document
// read all guildConfigs (cache these), firestore is just for saving in the case of bot going down
// read all of the
// add a cache

// main downsides:
// we want realtime updates, so eventually we are gonna have
// unless we don't want realtime updates
// for now no realtime updates, so you can use /lunar-view-roles to get updated

// possible approaches

// read all users from firestore
// read all discord server configs
// for each user (in memory)
// for each server config (in memory)
// for each rule (in memory)
// query the user tokens relevant to the rule (cache if possible)
// update user roles according to rule

// i like this approach because each user is handled one at a time which makes it easier to build a cache

// for each user
// for each server
// query tokens from relevant contracts
// update user roles

// read user from firestore
// read user tokens from full node

// for discord_server in discord_servers:
//   for user in discord_server:
//     if user in db:
//       updateDiscordRolesForUser(user)

// for user in db:
//   for discord_server in discord_servers (cached):

// 1
// loop through every discord server
// loop through every user in the discord server
// for each user in the discord server, check if that user is in the db
// for each user in the db, update their roles

// 2
// loop through every user in the db
// loop through every discord server
// for each server, check if the user is in the server
// for each user in the server, update their roles

// i like 1 better for the cron job because
// but for updating users on demand we will have to go with 2

// each cron job we are going to go through all the users in firestore and all the guilds in firestore
// so we might as well get them all at the beginning, and then go through them all
// that way we read each of them only once
// question is whether or not that will become a problem, hopefully not
// we don't want to make requests too quickly because we might take down the full nodes

// Login to Discord with your client's token
