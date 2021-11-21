import { LunarAssistant } from "..";

export async function updateAllDiscordUserRoles(this: LunarAssistant) {
  // read all users from firestore
  // read all serverConfigs from firestore
  // for each user in users (in memory)
  //   for each serverConfig in serverConfigs (in memory)
  //     check if the user is in the server (in memory), if so:
  //       for each rule in serverConfig (in memory)
  //         query the user tokens relevant to the rule (cache if possible)
  //         update user's discord roles according to rule
  //         save the user's discord roles to firestore

  console.log("Running updateAllDiscordUserRoles cronjob!");

  // loop over every user
  const usersSnapshot = await this.db.collection("users").get();
  const guildConfigsSnapshot = await this.db.collection("guildConfigs").get();

  await usersSnapshot.docs.reduce(
    (p, userDoc) =>
      p
        .then(() =>
          // update the user's discord roles
          this.coldUpdateDiscordRolesForUser(
            userDoc.id,
            userDoc,
            guildConfigsSnapshot
          )
        )
        .then(
          // delay for one second between processing each user
          () => new Promise((resolve) => setTimeout(() => resolve(null), 1000))
        ),
    new Promise((resolve, reject) => resolve(null))
  );
}
