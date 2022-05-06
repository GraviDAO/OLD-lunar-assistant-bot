import { MessageActionRow, MessageButton } from "discord.js";

export function castPollVoteButtons(enabled: boolean = true) {
    return new MessageActionRow({
        components: [
            new MessageButton({
                customId: "pollVote.yes",
                label: "Yes",
                style: "SUCCESS",
                disabled: !enabled
            }),
            new MessageButton({
                customId: "pollVote.no",
                label: "No",
                style: "DANGER",
                disabled: !enabled
            }),
            new MessageButton({
                customId: "pollVote.abstain",
                label: "Abstain",
                style: "PRIMARY",
                disabled: !enabled
            }),
            new MessageButton({
                customId: "pollVote.clear",
                label: "Reset",
                style: "SECONDARY",
                disabled: !enabled
            })
        ]
    })
}

export function confirmButtons (needle: string) {
	return new MessageActionRow({ components: [
		new MessageButton({
			customId: `${needle}Confirm`,
			label: 'Confirm',
			style: 'SUCCESS',
		}),
		new MessageButton({
			customId: `${needle}Cancel`,
			label: 'Cancel',
			style: 'DANGER',
		}),
	] });
}