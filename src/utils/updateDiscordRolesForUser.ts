import { LunarAssistant } from "../index";
import { UpdateUserDiscordRolesResponse } from "../types";
import { UserDocMissingError } from "../types/errors";

export async function updateDiscordRolesForUser(
  this: LunarAssistant,
  userID: string
): Promise<UpdateUserDiscordRolesResponse> {
  // get the user document
  const userDoc = await this.db.collection("users").doc(userID).get();

  // check that the user document exists
  if (!userDoc.exists)
    throw new UserDocMissingError("Couldn't find user document");

  // get guilds from db
  // later store this in memory for performance reasons
  const guildConfigsSnapshot = await this.db.collection("guildConfigs").get();

  if (guildConfigsSnapshot.empty) return { activeRoles: {}, removedRoles: {} };

  return this.coldUpdateDiscordRolesForUser(
    userID,
    userDoc,
    guildConfigsSnapshot
  );
}
