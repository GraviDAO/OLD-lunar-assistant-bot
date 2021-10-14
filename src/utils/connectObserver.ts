import { LunarAssistant } from "..";

// connect observer for listening to new transactions
export function connectObserver(this: LunarAssistant) {
  const ws = new WebSocket(`wss://observer.terra.dev`);
  ws.onopen = function () {
    console.info(`Connected to websocket. Listening for new block events...`);
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
    const data = JSON.parse(message.data.toString());
    await this.handleNewBlock(data);
  };
  ws.onclose = (e) => {
    console.info("websocket closed. reopening...");
    setTimeout(() => {
      this.connectObserver();
    }, 1000);
  };
  return ws;
}
