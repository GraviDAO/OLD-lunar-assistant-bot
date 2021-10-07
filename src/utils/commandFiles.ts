import fs from "fs";
import path from "path";

// Get all of the command files
export const commandFiles = fs
  .readdirSync(path.resolve(__dirname, "../commands"))
  .filter((file) => file.endsWith(".js"));
