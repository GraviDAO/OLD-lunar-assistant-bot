import fs from "fs";
import path from "path";

// Get all of the command files
export const contextMenuFiles = fs
  .readdirSync(path.resolve(__dirname, "../contextMenus"))
  .filter((file) => file.endsWith(".js"));
