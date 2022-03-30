import { Client, Intents } from "discord.js";
import { handle_interactions, run_sync_processes, token } from "../config.json";
import db from "./services/admin";
import { coldUpdateDiscordRolesForUser } from "./utils/coldUpdateDiscordRolesForUser";
import { connectObserver } from "./utils/connectObserver";
import { handleNewBlock } from "./utils/handleNewBlock";
import { handleNFTMoveEvent } from "./utils/handleNFTMoveEvent";
import { interactionHandler } from "./utils/interactionHandler";
import { registerCommands } from "./utils/registerCommands";
import { runSyncProcesses } from "./utils/runSyncProcesses";
import { updateAllDiscordUserRoles } from "./utils/updateAllDiscordUserRoles";
import { updateDiscordRolesForUser } from "./utils/updateDiscordRolesForUser";

export class LunarAssistant {
  client: Client;
  db: FirebaseFirestore.Firestore;

  // define functions
  public updateDiscordRolesForUser = updateDiscordRolesForUser;
  public coldUpdateDiscordRolesForUser = coldUpdateDiscordRolesForUser;
  public updateAllDiscordUserRoles = updateAllDiscordUserRoles;
  public handleNFTMoveEvent = handleNFTMoveEvent;
  public handleNewBlock = handleNewBlock;
  public connectObserver = connectObserver;
  public interactionHandler = interactionHandler;
  public runSyncProcesses = runSyncProcesses;

  constructor() {
    // Create a new client instance
    this.client = new Client({ intents: [Intents.FLAGS.GUILDS] });

    // save the db instance
    this.db = db;
  }

  async registerGuildCommands() {
    for (const guild of this.client.guilds.cache.values()) {
      console.log(`Registering commands for ${guild.name}`);
      try {
        await registerCommands(guild);
      } catch (e) {
        console.error(`Couldn't register commands for ${guild.name}`);
        console.error(e);
      }
      await new Promise((r) => setTimeout(r, 1000));
    }
  }

  start(onReady: () => void) {
    // Setup listeners

    // When the client is ready, run this code (only once)
    this.client.once("ready", () => {
      // Reregister guild commands for all servers
      this.registerGuildCommands();

      // only add listeners when not in maintenance mode
      if (!run_sync_processes) {
        this.runSyncProcesses();
      }
      // Call the passed onReady function
      onReady();
    });

    if (handle_interactions) {
      // When the bot is added to a server, configure the slash commands
      this.client.on("guildCreate", registerCommands);

      // Handle slash command interactions
      this.client.on("interactionCreate", (interaction) =>
        this.interactionHandler(interaction)
      );
    }

    // start the discord bot
    this.client.login(token);
  }
}

// create lunar assistant bot
const lunarAssistantBot = new LunarAssistant();

// start the lunar assistant bot
lunarAssistantBot.start(() => {
  console.log("Ready!");
});
