import { Client, Intents } from "discord.js";
import cron from "node-cron";
import { maintenance_mode, token } from "../config.json";
import db from "./services/admin";
import { coldUpdateDiscordRolesForUser } from "./utils/coldUpdateDiscordRolesForUser";
import { connectObserver } from "./utils/connectObserver";
import { handleNewBlock } from "./utils/handleNewBlock";
import { handleNFTMoveEvent } from "./utils/handleNFTMoveEvent";
import { interactionHandler } from "./utils/interactionHandler";
import { registerCommands } from "./utils/registerCommands";
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

  constructor() {
    // Create a new client instance
    this.client = new Client({ intents: [Intents.FLAGS.GUILDS] });

    // save the db instance
    this.db = db;
  }

  registerGuildCommands() {
    this.client.guilds.cache.forEach((guild) => {
      console.log(`Registering commands for ${guild.name}`);
      registerCommands(guild);
    });
  }

  start(onReady: () => void) {
    // Setup listeners

    // When the client is ready, run this code (only once)
    this.client.once("ready", () => {
      // Reregister guild commands for all servers
      this.registerGuildCommands();
      // Call the passed onReady function
      onReady();
    });

    // When the bot is added to a server, configure the slash commands
    this.client.on("guildCreate", registerCommands);

    // handle slash command interactions
    this.client.on("interactionCreate", (interaction) =>
      this.interactionHandler(interaction)
    );

    // only add listeners when not in maintenance mode
    if (!maintenance_mode) {
      // cronjob to update discord roles once a day
      cron.schedule("0 0 * * *", () => this.updateAllDiscordUserRoles());

      // only start triggering updates after the initial snapshot
      let initialSnapshot = true;

      // update discord roles whenever a user document changes
      this.db.collection("users").onSnapshot((querySnapshot) => {
        if (!initialSnapshot) {
          const changedDocs = querySnapshot.docChanges();
          console.log("Docs changed: " + changedDocs.map((doc) => doc.doc.id));
          changedDocs.reduce(
            (p, changedDoc) =>
              p
                .then(() =>
                  this.updateDiscordRolesForUser(changedDoc.doc.id).catch(
                    // ignore errors
                    (error) => {}
                  )
                )
                .then(
                  // delay for one second between processing each user
                  () =>
                    new Promise((resolve) =>
                      setTimeout(() => resolve(null), 1000)
                    )
                ),
            new Promise((resolve) => resolve(null))
          );
        } else {
          initialSnapshot = false;
        }
      });

      // listen to nft transfer events
      this.connectObserver();
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
