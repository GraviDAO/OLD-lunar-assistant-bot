import fs from "fs";
import path from "path";

// Get all of the command files
export const buttonFiles = fs
  .readdirSync(path.resolve(__dirname, "../buttons"))
  .filter((file) => file.endsWith(".js"));
