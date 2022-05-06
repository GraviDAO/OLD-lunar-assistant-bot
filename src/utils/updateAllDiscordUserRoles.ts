import { Int } from "@terra-money/terra.js";
import { LunarAssistant } from "..";
import { User } from "../shared/firestoreTypes";

export async function updateAllDiscordUserRoles(this: LunarAssistant, startAtIndex: number) {
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

  for(let index = startAtIndex; index < numUsers; index++)
  {
    const startTime = Date.now();
    const userDoc = usersSnapshot.docs[index];
    console.log(
      `Cronjob status: ${index} / ${numUsers}. ID: ${
        userDoc.id
      }. Wallet: ${(userDoc.data() as User).wallet}`
    );
    try{
      // update the user's discord roles
      await this.coldUpdateDiscordRolesForUser(
        userDoc.id,
        userDoc,
        guildConfigsSnapshot,
        {serverIds:[]},
      );
      console.log(
        `Finished processing: ${index} / ${numUsers}. ID: ${
          userDoc.id
        }. Wallet: ${(userDoc.data() as User).wallet}. Processing Time: ${(Date.now()-startTime)}`
      );
    }
    catch(error) {
      console.log(
        `Failed to update roles for ${(userDoc.data() as User).wallet}. Processing Time: ${(Date.now()-startTime)}`
      );
      console.error(error);
    };
  }
  /*await usersSnapshot.docs.reduce(
    (p, userDoc, startAtIndex) =>
      p
        .then(() => {
          console.log(
            `Cronjob status: ${startAtIndex} / ${numUsers}. ID: ${
              userDoc.id
            }. Wallet: ${(userDoc.data() as User).wallet}`
          );
          // update the user's discord roles
          return this.coldUpdateDiscordRolesForUser(
            userDoc.id,
            userDoc,
            guildConfigsSnapshot,
            {serverIds:[]},
          )
            .then(() => {
              console.log(
                `Finished processing: ${startAtIndex} / ${numUsers}. ID: ${
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
          // delay for 0.5 seconds between processing each user
          () => new Promise((resolve) => setTimeout(() => resolve(null), 500))
        ),
    new Promise((resolve, reject) => resolve(null))
  );*/

  const endTime = Date.now();

  console.log(
    `Finished cronjob! End time: ${endTime}. Time taken: ${endTime - startTime}`
  );
}
