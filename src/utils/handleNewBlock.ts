import { LunarAssistant } from "..";
import { getRelevantContractAddresses } from "./getRelevantContractAddresses";

export async function handleNewBlock(this: LunarAssistant, data: any) {
  const guildConfigsSnapshot = await this.db.collection("guildConfigs").get();

  // get the list of contract addresses we are interested in
  const interestedContractAddresses =
    getRelevantContractAddresses(guildConfigsSnapshot);

  // get the list of transactions we are interested in
  const nftTransferTransactions = data.data.txs.reduce(
    (acc: any[], txn: any) => {
      if (!txn.logs) return acc;
      if (txn.logs.length === 0) return acc;

      // find transactions executed against interesting contract addresses
      const nftExecuteEvent = txn.logs[0].events.find(
        (tmpEvent: any) =>
          tmpEvent.type === `execute_contract` &&
          tmpEvent.attributes.some(
            (attr: any) =>
              attr.key === `contract_address` &&
              interestedContractAddresses.nft.includes(attr.value)
          )
      );

      if (nftExecuteEvent) {
        // find nft move events in the interested transactions
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

  console.log(
    `Processing block with ${nftTransferTransactions.length} relevant events.`
  );

  // process each relevant nft move event
  for (let i = 0; i < nftTransferTransactions.length; i += 1) {
    await this.handleNFTMoveEvent(
      nftTransferTransactions[i],
      guildConfigsSnapshot
    );
  }
}
