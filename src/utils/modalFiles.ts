import fs from "fs";
import path from "path";

// Get all of the modal files
export const modalFiles = fs
  .readdirSync(path.resolve(__dirname, "../modals"))
  .filter((file) => file.endsWith(".js"));
