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

  start(onReady: () => void) {
    // Setup listeners

    // When the client is ready, run this code (only once)
    this.client.once("ready", onReady);

    // When the bot is added to a server, configure the slash commands
    this.client.on("guildCreate", registerCommands);

    // handle slash command interactions
    this.client.on("interactionCreate", (interaction) =>
      this.interactionHandler(interaction)
    );

    // only add listeners when not in maintenance mode
    if (!maintenance_mode) {
      // cronjob to update discord roles once a day
      cron.schedule("0 0 * * *", () => this.updateAllDiscordUserRoles);

      // update discord roles whenever a user document changes
      this.db.collection("users").onSnapshot((querySnapshot) => {
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
                    setTimeout(() => resolve(null), 2000)
                  )
              ),
          new Promise((resolve) => resolve(null))
        );
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
