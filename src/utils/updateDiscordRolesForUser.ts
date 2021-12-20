import { LunarAssistant } from "../index";
import { passportApi } from "../services/passport";
import { UpdateUserDiscordRolesResponse } from "../types";

export async function updateDiscordRolesForUser(
  this: LunarAssistant,
  userID: string
): Promise<UpdateUserDiscordRolesResponse> {
  const walletAddresses = await passportApi.getWalletsByDiscordId(userID);

  // get guilds from db
  // later store this in memory for performance reasons
  const guildConfigsSnapshot = await this.db.collection("guildConfigs").get();

  if (guildConfigsSnapshot.empty) return { activeRoles: {}, removedRoles: {} };

  return this.coldUpdateDiscordRolesForUser(
    userID,
    walletAddresses,
    guildConfigsSnapshot
  );
}
