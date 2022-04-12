import { LunarAssistant } from "..";
import { User } from "../shared/firestoreTypes";

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

  const startTime = Date.now();
  console.log(
    `Running updateAllDiscordUserRoles cronjob! Start time: ${startTime}`
  );

  // loop over every user
  const usersSnapshot = await this.db.collection("users").get();
  const guildConfigsSnapshot = await this.db.collection("guildConfigs").get();

  const numUsers = usersSnapshot.docs.length;

  await usersSnapshot.docs.reduce(
    (p, userDoc, index) =>
      p
        .then(() => {
          console.log(
            `Cronjob status: ${index} / ${numUsers}. ID: ${
              userDoc.id
            }. Wallet: ${(userDoc.data() as User).wallet}`
          );
          // update the user's discord roles
          return this.coldUpdateDiscordRolesForUser(
            userDoc.id,
            userDoc,
            guildConfigsSnapshot
          )
            .then(() => {
              console.log(
                `Finished processing: ${index} / ${numUsers}. ID: ${
                  userDoc.id
                }. Wallet: ${(userDoc.data() as User).wallet}`
              );
            })
            .catch((error) => {
              console.log(
                `Failed to update roles for ${(userDoc.data() as User).wallet}`
              );
              console.error(error);
            });
        })
        .then(
          // delay for 5 seconds between processing each user
          () => new Promise((resolve) => setTimeout(() => resolve(null), 5000))
        ),
    new Promise((resolve, reject) => resolve(null))
  );

  const endTime = Date.now();

  console.log(
    `Finished cronjob! End time: ${endTime}. Time taken: ${endTime - startTime}`
  );
}
