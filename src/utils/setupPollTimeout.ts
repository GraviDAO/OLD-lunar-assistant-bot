import { BaseGuildTextChannel, Guild, GuildBasedChannel, GuildChannel, Message } from "discord.js";
import { LunarAssistant } from "..";
import { Poll } from "../shared/firestoreTypes";
import { archivePoll } from "./archivePoll";

export const setupPollTimeout = async (
  lunarAssistant: LunarAssistant,
  guild: Guild,
  polls: Poll[]
  ) => {
  const now = Date.now();
  
  for (const p of polls) {
    let channel: GuildBasedChannel | null;
    
    try {
      channel = guild.channels.cache.get(p.channelId!) ?? await guild.channels.fetch(p.channelId!);
      if (!channel || !(channel instanceof BaseGuildTextChannel)) continue;
    } catch (e) {
    console.log(e);
    continue;
    }

    let message: Message;
    try {
      message = channel.messages.cache.get(p.messageId!) ?? await channel.messages.fetch(p.messageId!);
      if (!message) continue;
    } catch (error) {
      continue;
    }

    if (p.endsAt < now) {
      archivePoll(lunarAssistant, message, p);
    } else {
      setTimeout(() => { archivePoll(lunarAssistant, message, p) }, p.endsAt - now);
    }
    
    await new Promise((r) => setTimeout(r, 1000));
  }
  
};