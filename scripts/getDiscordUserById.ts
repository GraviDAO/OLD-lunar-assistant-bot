const { Client } = require("discord.js");
import { token } from "../config.json";

const client = new Client({ intents: [] });
client.token = token;

const discordID = "750960425801089044";
const fetchUser = async (id: string) => client.users.fetch(id);
fetchUser(discordID).then(console.log);
