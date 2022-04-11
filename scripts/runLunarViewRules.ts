import { LunarAssistant } from "../src";
import { User } from "../src/shared/firestoreTypes";
import { UserDocMissingError } from "../src/types/errors";
import {
  getActiveInactiveRoleIdsForGuildConfigDoc,
  propogateRoleUpdatesForGuildConfigDoc,
} from "../src/utils/coldUpdateDiscordRolesForUser";
import {
  guildIdDictToGuildNameDict,
  guildRoleDictToGuildRoleNameDict,
} from "../src/utils/helper";

const runLunarViewRoles = async (lunarAssistant: LunarAssistant) => {
  const userID = "164855485831446530";
  const guildID = "881200105817010258";

  // Get the user document
  const userDoc = await lunarAssistant.db.collection("users").doc(userID).get();

  // Check that the user document exists
  if (!userDoc.exists)
    throw new UserDocMissingError("Couldn't find user document");

  // Get the users wallet address
  const walletAddress = (userDoc.data() as User).wallet;

  // Get guild doc from db
  const guildConfigDoc = await lunarAssistant.db
    .collection("guildConfigs")
    .doc(guildID)
    .get();

  const { activeRoles, inactiveRoles } =
    await getActiveInactiveRoleIdsForGuildConfigDoc(
      lunarAssistant,
      userID,
      walletAddress,
      guildConfigDoc
    );

  const activeRoleNames = guildIdDictToGuildNameDict(
    lunarAssistant,
    guildRoleDictToGuildRoleNameDict(activeRoles)
  );

  console.log("Active role names", activeRoleNames);

  const { addedRoles, persistedRoles, removedRoles } =
    await propogateRoleUpdatesForGuildConfigDoc(
      lunarAssistant,
      userID,
      guildConfigDoc,
      activeRoles,
      inactiveRoles
    );

  const addedRoleNames = guildRoleDictToGuildRoleNameDict(addedRoles);
  const persistedRoleNames = guildRoleDictToGuildRoleNameDict(persistedRoles);
  const removedRoleNames = guildRoleDictToGuildRoleNameDict(removedRoles);

  console.log(`Got all tokens and updated roles for ${walletAddress}:`, {
    addedRoles: addedRoleNames,
    persistedRoles: persistedRoleNames,
    removedRoles: removedRoleNames,
  });
};

// Create lunar assistant bot
const lunarAssistantBot = new LunarAssistant();

lunarAssistantBot.start(runLunarViewRoles, false, false);
