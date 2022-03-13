import WebSocket from "ws";
import { LunarAssistant } from "..";

// connect observer for listening to new transactions
export function connectObserver(this: LunarAssistant) {
  const ws = new WebSocket(`wss://observer.terra.dev`);
  ws.onopen = function () {
    console.log(`Connected to websocket. Listening for new block events...`);
    // subscribe to new_block events
    ws.send(
      JSON.stringify({
        subscribe: `new_block`,
        chain_id: "columbus-5",
      })
    );
  };
  ws.onmessage = async (message) => {
    /* process messages here */

    // get data from message
    const data = JSON.parse(message.data.toString());

    // Wait 20 seconds for changes to propogate before handling new block
    setTimeout(() => this.handleNewBlock(data), 20000);
  };
  ws.onclose = (e) => {
    console.log("Websocket closed. Reopening...");
    setTimeout(() => {
      this.connectObserver();
    }, 1000);
  };
  return ws;
}
