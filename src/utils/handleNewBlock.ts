import { Client } from "discord.js";
import db from "../services/admin";
import { guildRuleToNFTRule } from "./guildRuleToNFTRule";
import { coldUpdateDiscordRolesForUser } from "./updateDiscordRolesForUser";

const handleResponse = async (
  client: Client,
  res: any,
  guildConfigsSnapshot: FirebaseFirestore.QuerySnapshot<FirebaseFirestore.DocumentData>
) => {
  console.info(`Handling nft move event`);
  const updatedWallets =
    res.action === `mint`
      ? [res.minter]
      : ["transfer_nft", "send_nft"].includes(res.action)
      ? [res.sender, res.recipient]
      : [];

  // for each updated wallet, check if it has a corresponding Discord ID and if so, call it
  await Promise.all(
    updatedWallets.map(async (wallet) => {
      const usersRegisteredWithWallet = await db
        .collection("users")
        .where("wallet", "==", wallet)
        .get();

      if (
        !usersRegisteredWithWallet.empty &&
        usersRegisteredWithWallet.docs.length === 1
      ) {
        const userDoc = usersRegisteredWithWallet.docs[0];
        await coldUpdateDiscordRolesForUser(
          client,
          userDoc.id,
          userDoc,
          guildConfigsSnapshot
        );
      }
    })
  );
};

export const handleNewBlock = async (client: Client, data: any) => {
  const guildConfigsSnapshot = await db.collection("guildConfigs").get();

  const interestedContractAddresses = guildConfigsSnapshot.docs.reduce(
    (acc, guildConfigDoc) => {
      const guildConfig = guildConfigDoc.data() as GuildConfig;
      const guildConfigContractAddresses = guildConfig.rules.reduce(
        (acc, rule) => {
          try {
            const nftRule = guildRuleToNFTRule(rule);
            acc.add(nftRule.nftAddress);
          } catch (e) {
            console.error("Couldn't transform guild rule to nft rule");
          }
          return acc;
        },
        new Set<string>()
      );

      guildConfigContractAddresses.forEach(acc.add, acc);
      return acc;
    },
    new Set<string>()
  );

  const nftTransferTransactions = data.data.txs.reduce(
    (acc: any[], txn: any) => {
      if (!txn.logs) return acc;
      if (txn.logs.length === 0) return acc;

      // want to filter for transactions that have an nft transfer event

      // we are interested in the "mint" action
      // transfer_nft
      // send_nft

      // what about cases where the nft is sent to randomearth?

      const nftExecuteEvent = txn.logs[0].events.find(
        (tmpEvent: any) =>
          tmpEvent.type === `execute_contract` &&
          tmpEvent.attributes.some(
            (attr: any) =>
              attr.key === `contract_address` &&
              interestedContractAddresses.has(attr.value)
          )
      );

      if (nftExecuteEvent) {
        const nftMoveEvent = txn.logs[0].events.find(
          (tmpEvent: any) =>
            tmpEvent.type === `wasm` &&
            tmpEvent.attributes.some(
              (attr: any) =>
                attr.key === `action` &&
                ["mint", "transfer_nft", "send_nft"].includes(attr.value)
            )
        );
        if (nftMoveEvent) {
          acc.push(
            nftMoveEvent.attributes.reduce((accAttr: any, attr: any) => {
              const newVal = { [attr.key]: attr.value };
              return Object.assign(newVal, accAttr);
            }, {})
          );
        }
      }
      return acc;
    },
    []
  );
  for (let i = 0; i < nftTransferTransactions.length; i += 1) {
    await handleResponse(
      client,
      nftTransferTransactions[i],
      guildConfigsSnapshot
    );
  }
};
