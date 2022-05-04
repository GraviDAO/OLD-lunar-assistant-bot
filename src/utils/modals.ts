import { Modal, TextInputComponent } from "discord-modals";

export function pollCreateModal(){
    return new Modal({
        custom_id: 'create-poll',
        title: 'Create a poll',
        components: [ ]
    }).addComponents(new TextInputComponent({
        customId: 'nftAddress',
        label: 'NFT Address',
        minLength: 5,
        maxLength: 256,
        placeholder: 'NFT Collection Address',
        required: true,
        style: 'SHORT',
    })).addComponents(new TextInputComponent({
        customId: 'title',
        label: 'Poll title',
        minLength: 5,
        maxLength: 256,
        placeholder: 'New Poll Title',
        required: true,
        style: 'SHORT',
    })).addComponents(new TextInputComponent({
        customId: 'description',
        label: 'Poll description',
        minLength: 20,
        maxLength: 4000,
        placeholder: 'New Poll Description',
        required: true,
        style: 'LONG',
    })).addComponents(new TextInputComponent({
        customId: 'quorum',
        label: 'Quorum (0-100)',
        minLength: 0,
        maxLength: 4000,
        placeholder: 'e.g.: 40 for 40%',
        required: false,
        style: 'SHORT',
    })).addComponents(new TextInputComponent({
        customId: 'time',
        label: 'End Time (Default: 14d)',
        minLength: 0,
        maxLength: 4000,
        placeholder: 'Examples: 1m,1h,1d',
        required: false,
        style: 'SHORT',
    }))
}