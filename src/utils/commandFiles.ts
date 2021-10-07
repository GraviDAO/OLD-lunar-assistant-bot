import fs from "fs";

// Get all of the command files
export const commandFiles = fs
  .readdirSync("./commands")
  .filter((file) => file.endsWith(".js"));
