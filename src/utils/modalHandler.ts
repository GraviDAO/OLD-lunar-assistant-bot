import { ModalSubmitInteraction } from "discord-modals";
import { Collection, Interaction } from "discord.js";
import path from "path";
import { LunarAssistant } from "..";
import { ModalData } from "../types";
import { modalFiles } from "./modalFiles";

// Create a collection for the modal handles
const modalHandlers = new Collection<string, ModalData>();

// Populate the modal handlers collection
for (const file of modalFiles) {
  const modalFilePath = path.resolve(__dirname, `../modals/${file}`);
  const modal = require(modalFilePath).default;

  // Set a new item in the Collection
  // With the key as the modal name and the value as the exported module
  modalHandlers.set(modal.customId, modal);
}

export async function modalHandler(
  this: LunarAssistant,
  interaction: Interaction
) {
  if (!(interaction instanceof ModalSubmitInteraction)) return;

  // get the command handler
  const modal = modalHandlers.get(interaction.customId);

  if (!modal) return;

  // try to run the command handler
  try {
    await modal.execute(this, interaction);
  } catch (error) {
    console.error(error);
    await interaction.reply({
      content: "There was an error while executing this command!",
      ephemeral: true,
    });
  }
}
