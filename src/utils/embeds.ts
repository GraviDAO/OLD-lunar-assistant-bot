import { Formatters, MessageEmbed, User } from "discord.js";
import { Poll } from "../shared/firestoreTypes";

export function primaryEmbed(title: string | undefined = undefined, description: string | undefined = undefined) {
    return new MessageEmbed({
        title: title,
        description: description,
        color: 'BLURPLE'
    })
}

export function secondaryEmbed(title: string | undefined = undefined, description: string | undefined = undefined) {
    return new MessageEmbed({
        title: title,
        description: description,
        color: 'DARK_AQUA'
    })
}

export function pollEmbed(data: Poll, author: User) {
    return new MessageEmbed({
        title: `Poll #${data.uuid} | ${data.title}`,
        description: data.description,
        footer: {
            text: data.uuid,
        },
        timestamp: Date.now(),
        color: "BLURPLE",
        author: {
            name: author.tag,
            icon_url: author.avatarURL() ?? undefined
        },
        fields: [
            {
                name: "End Time",
                value: `${Formatters.time(parseInt((data.endsAt / 1000).toFixed(0)), "F")} (${Formatters.time(parseInt((data.endsAt / 1000).toFixed(0)), "R")})`,
                inline: true,
            },
            {
                name: "Quorum",
                value: data.quorum ? `${data.quorum} Votes` : "Not Specified",
                inline: true,
            }
        ]
    })
}

export function pollResultsEmbed(data: Poll) {
    return new MessageEmbed({
        title: `Results for Poll #${data.uuid} | __${data.title}__`,
        footer: {
            text: "Built by GraviDAO",
        },
        fields: [
            {
                name: "Total Valid votes",
                value: `\`\`\`${data.results!.total}\`\`\``,
                inline: true,
            },
            {
                name: "󠀠",
                value: "󠀠",
                inline: true,
            },
            {
                name: data.quorum !== 0 ? "Status" : "󠀠",
                value: data.quorum !== 0 ? data.results!.total >= data.quorum ? data.results!.yes > data.results!.no ? "✅ Passed" : "❌ Rejected" : "🚫 Not enough votes gathered" : "󠀠",
                inline: true,
            },
            {
                name: "✅ | Yes Votes",
                value: `\`\`\`${data.results!.yes}\`\`\``,
                inline: true,
            },
            {
                name: "❌ | No Votes",
                value: `\`\`\`${data.results!.no}\`\`\``,
                inline: true,
            },
            {
                name: "🚫 | Abstain Votes",
                value: `\`\`\`${data.results!.abstain}\`\`\``,
                inline: true,
            },
        ],
        timestamp: Date.now(),
        color: "BLURPLE",
    })
}

export function pollsEmbed(polls: Poll[]) {
    return new MessageEmbed({
        title: "Server Polls",
        description: polls.length === 0 ? "No polls have been have been found" : undefined,
        color: "BLURPLE",
        fields: polls.map((p: Poll) => {
            return {
                name: p.title,
                value: `__Creator:__ ${Formatters.userMention(p.creator)}(${p.creator})\n${(p.votes.yes.length + p.votes.no.length + p.votes.abstain.length) ?? 0 } votes`,
            }
        })
    })
}