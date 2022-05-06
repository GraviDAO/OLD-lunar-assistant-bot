import cron from "node-cron";
import { LunarAssistant } from "..";

export async function runSyncProcesses(this: LunarAssistant) {
  // cronjob to update discord roles once a day
  cron.schedule("1 9 * * *", () => this.updateAllDiscordUserRoles(0));

  // only start triggering updates after the initial snapshot
  let initialSnapshot = true;

  // update discord roles whenever a user document changes
  this.db.collection("users").onSnapshot((querySnapshot) => {
    if (!initialSnapshot) {
      const changedDocs = querySnapshot.docChanges();
      console.log("Docs changed: " + changedDocs.map((doc) => doc.doc.id));
      changedDocs.reduce(
        (p, changedDoc) =>
          p
            .then(() =>
              this.updateDiscordRolesForUser(changedDoc.doc.id).catch(
                // ignore errors
                (error) => {}
              )
            )
            .then(
              // delay for one second between processing each user
              () =>
                new Promise((resolve) => setTimeout(() => resolve(null), 3000))
            ),
        new Promise((resolve) => resolve(null))
      );
    } else {
      initialSnapshot = false;
    }
  });

  // listen to nft transfer events
  //this.connectObserver();
}
