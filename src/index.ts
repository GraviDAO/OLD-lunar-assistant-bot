import { Client, Guild, Intents } from "discord.js";
import discordModals from "discord-modals";
import { handle_interactions, run_sync_processes, token } from "../config.json";
import db from "./services/admin";
import { coldUpdateDiscordRolesForUser } from "./utils/coldUpdateDiscordRolesForUser";
import { connectObserver } from "./utils/connectObserver";
import { handleNewBlock } from "./utils/handleNewBlock";
import { handleNFTMoveEvent } from "./utils/handleNFTMoveEvent";
import { interactionHandler } from "./utils/interactionHandler";
import { modalHandler } from "./utils/modalHandler";
import { registerCommands } from "./utils/registerCommands";
import { runSyncProcesses } from "./utils/runSyncProcesses";
import { updateAllDiscordUserRoles } from "./utils/updateAllDiscordUserRoles";
import { updateDiscordRolesForUser } from "./utils/updateDiscordRolesForUser";
import { setupPollTimeout } from "./utils/setupPollTimeout";
import { GuildPolls, Poll } from "./shared/firestoreTypes";

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
  public modalHandler = modalHandler;
  public runSyncProcesses = runSyncProcesses;

  constructor() {
    // Create a new client instance
    this.client = new Client({ intents: [Intents.FLAGS.GUILDS] });

    // save the db instance
    this.db = db;

    discordModals(this.client);
  }

  async registerGuildCommands() {
    try {
      await registerCommands();
    } catch (e) {
      console.error(
        `Couldn't register commands due to the following error: ${e}`
      );
    }
  }

  async startPollTimeouts() {
    const guildPolls = await db.collection("guildPolls").get();

    for (const guildPoll of guildPolls.docs) {
      let guild: Guild;
      const polls = ((guildPoll.data() as GuildPolls).polls ?? []).filter(
        (p: Poll) => p.active
      );
      try {
        guild =
          this.client.guilds.cache.get(guildPoll.id) ??
          (await this.client.guilds.fetch(guildPoll.id));
        if (!guild) continue;
      } catch (e) {
        continue;
      }
      try {
        await setupPollTimeout(this, guild, polls);
      } catch (e) {
        console.error(
          `Couldn't create poll timeouts commands for ${guild.name}`
        );
        console.error(e);
      }

      await new Promise((r) => setTimeout(r, 1000));
    }
  }

  start(
    onReady: (lunarAssistantBot: LunarAssistant) => void,
    runSyncProcesses: boolean,
    handleInteractions: boolean
  ) {
    // Setup listeners

    // When the client is ready, run this code (only once)
    this.client.once("ready", () => {
      // Reregister guild commands for all servers
      this.registerGuildCommands();

      this.startPollTimeouts();

      // only add listeners when not in maintenance mode
      if (runSyncProcesses) {
        this.runSyncProcesses();
      }
      // Call the passed onReady function
      onReady(this);
    });

    if (handleInteractions) {
      // When the bot is added to a server, configure the slash commands
      this.client.on("guildCreate", registerCommands);

      // Handle slash command interactions
      this.client.on("interactionCreate", (interaction) =>
        this.interactionHandler(interaction)
      );

      // Handle modal interactions
      this.client.on("modalSubmit", (interaction) =>
        this.modalHandler(interaction)
      );
    }

    this.client.on("rateLimit", (data) => {
      console.log("Getting rate limited.");
      console.log(JSON.stringify(data));
    });

    // start the discord bot
    this.client.login(token);
  }
}

// create lunar assistant bot
const lunarAssistantBot = new LunarAssistant();

// start the lunar assistant bot
lunarAssistantBot.start(
  () => {
    console.log("Ready!");
  },
  run_sync_processes,
  handle_interactions
);
