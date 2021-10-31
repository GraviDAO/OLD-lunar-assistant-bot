import { LunarAssistant } from "..";

export async function handleNFTMoveEvent(
  this: LunarAssistant,
  res: any,
  guildConfigsSnapshot: FirebaseFirestore.QuerySnapshot<FirebaseFirestore.DocumentData>
) {
  // get the wallets involved in the event
  const updatedWallets =
    res.action === `mint`
      ? [res.minter]
      : ["transfer_nft", "send_nft"].includes(res.action)
      ? [res.sender, res.recipient]
      : [];

  // for each updated wallet, check if it has a corresponding Discord ID
  // if so, update its discord roles
  await Promise.all(
    updatedWallets.map(async (wallet) => {
      const usersRegisteredWithWallet = await this.db
        .collection("users")
        .where("wallet", "==", wallet)
        .get();

      if (
        !usersRegisteredWithWallet.empty &&
        usersRegisteredWithWallet.docs.length === 1
      ) {
        console.log(
          `Updating user roles for ${wallet} because of nft move event`
        );

        const userDoc = usersRegisteredWithWallet.docs[0];
        await this.coldUpdateDiscordRolesForUser(
          userDoc.id,
          userDoc,
          guildConfigsSnapshot
        );
      }
    })
  );
}
