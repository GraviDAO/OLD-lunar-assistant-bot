# Lunar Assistant Bot

This repo contains the lunar assistant discord bot. It provides the following slash commands: 
## Commands

### lunar-configure

Configures the GuildConfig for the discord server. Has the following subcommands:
#### add-rule

Adds a rule for granting a role to users. When a user's wallet meets the conditions of the rule, they will be granted the relevant role. Takes the following arguments:
- nft-address (required) : The contract address against which to check for nft ownership
- role (required) : The role to give to users which meet this rule.
- quantity (optional, 1 by default) : The quantity of matching nfts that a user must hold in order to meet the rule.
- token-ids (optional, all by default) : A list of token ids that the rule is restricted to.

#### view-rules

View the rules currently configured for the server.

#### remove-rule

Remove a rule based on its index in the output of `/view-rules`. Takes the following arguments:
- rule-number (required) : The index of the rule to remove.

#### add-role-link

Link two roles together. Whenever the required role is removed from a user with the dependent role, an alert will be sent in lunar-alerts channel. Takes the following arguments:
- required-role (required) : The role that is required in order to have the dependent role.
- dependent-role (required) : The role that depends on the required role.
#### view-role-links

View the rule links currently configured for the server.
#### remove-role-link

Remove a role link based on its index in the output of `/view-role-links`. Takes the following arguments:
- rule-number (required) : The index of the role link to remove.

### lunar-link

Allows a user to link a wallet to their discord account. Upon using lunar-link, the user will be sent a link to the lunar assistant website from which they can sign a transaction that proves ownership of the wallet they are registering.

For now a user can only have a single wallet registered at a time. Running lunar-link multiple times will overwrite the users existing wallet.

Upon linking a new wallet, the user's roles are updated to reflect the contents of the new wallet.

### lunar-view-roles

Forces a role update based on the contents of a user's linked wallet, then displays the roles that a user is granted. Takes the following arguments:
- private-response (optional, false by default): Indicate whether or not you want to make the response viewable to everyone or just yourself.
### lunar-view-wallet

Displays the wallet a user has linked to their account (only visible to the user who sent the command).


## Adding Lunar Assistant To Your Discord Server

You can follow this link to add the Lunar Assistant bot to your discord server: https://discord.com/api/oauth2/authorize?client_id=893178480303407135&permissions=268435456&scope=applications.commands%20bot

## Roadmap

See the roadmap here: https://github.com/orgs/GraviDAO/projects

## Setup

Copy the `config.json.example` to `config.json` and populate the values.
## Usage

```
npm install
tsc
node dist/src/index.js
```

## Example Addresses For Testing

- Galactic Punks contract: `terra103z9cnqm8psy0nyxqtugg6m7xnwvlkqdzm4s4k`
- Luna Lapins contract: `terra1kekvz7nm8ed2nd8mdny8ukuap00mg52txrnwhs`