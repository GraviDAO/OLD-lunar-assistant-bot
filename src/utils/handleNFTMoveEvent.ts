import { LunarAssistant } from "..";
import { passportApi } from "../services/passport";

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
      const discordId = await passportApi.getDiscordIdByWallet(wallet);
      const walletAddresses = await passportApi.getWalletsByDiscordId(
        discordId
      );

      console.log(
        `Updating user roles for ${wallet} because of nft move event`
      );

      await this.coldUpdateDiscordRolesForUser(
        discordId,
        walletAddresses,
        guildConfigsSnapshot
      );
    })
  );
}
