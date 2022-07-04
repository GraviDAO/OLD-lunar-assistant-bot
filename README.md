# Lunar Assistant Bot

This repo contains the lunar assistant discord bot. See the guide here: https://guide.lunarassistant.com. It provides the following slash commands: 
## Commands

### lunar-configure

Configures the GuildConfig for the discord server. Has the following command groups:

<!-- #### rules command group

Command group for configuring the rules which grant roles based on wallet holdings. Useful for creating private channels that only those with certain wallet holdings have access to, and for letting users show off their wallets via roles. -->
#### add-nft-rule

Adds a rule for granting a role to users based on nft ownership. When a user's wallet meets the conditions of the rule, they will be granted the relevant role. Takes the following arguments:
- nft-address (required) : The contract address against which to check for nft ownership
- role (required) : The role to give to users which meet this rule.
- quantity (optional, 1 by default) : The quantity of matching nfts that a user must hold in order to meet the rule.
- token-ids (optional, all by default) : A list of token ids that the rule is restricted to.

#### add-cw20-rule

Adds a rule for granting a role to users based on cw20 token ownership. When a user's wallet meets the conditions of the rule, they will be granted the relevant role. Takes the following arguments:
- cw20-address (required) : The contract address against which to check for nft ownership
- role (required) : The role to give to users which meet this rule.
- quantity (optional, 1 by default) : The quantity of cw20 tokens that a user must hold in order to meet the rule.

#### add-api-rule

Adds a rule for granting a role to users based on the response of the specified API. When a user's wallet meets the conditions of the rule, they will be granted the relevant role. Takes the following arguments:
- api-url (required) : The URL of your custom API against which to check for permission.
- role (required) : The role to give to users which meet this rule.

Creating your custom API:
- The url must contain $(wallet) which is an identifier that will be replaced by each user wallet at execution time. Example url: https://myApiUrl.com?walletAddress=$(wallet) 
- The API must return its response (true or false) in the following format to be parsed correctly: {"allowed":true}


#### view-rules

View the rules currently configured for the server.

#### remove-rule

Remove a rule based on its index in the output of `/view-rules`. Takes the following arguments:
- rule-number (required) : The index of the rule to remove.

<!-- #### dependencies command group

Command group for configuring role dependencies. Useful for making manually granted roles depend on wallet based roles (i.e., you can only be a galactic chairman if you hold at least 2 punks).

##### add-role-dependency

Add a relationship by which one role depends on another. Whenever the required role is removed from a user with the dependent role, the dependent role will be removed as well. Takes the following arguments:
- required-role (required) : The role that is required in order to have the dependent role.
- dependent-role (required) : The role that depends on the required role.
##### view-role-dependencies

View the rule dependencies currently configured for the server.

##### remove-role-dependencies

Remove a role dependency based on its index in the output of `/view-role-links`. Takes the following arguments:
- rule-number (required) : The index of the role link to remove.

#### alerts command group

##### add-role-alert

Add an alert that triggers whenever a given role is added or removed from a user. Takes the following arguments:
- role (required) : The role to send an alert about whenever it is added or removed.

##### view-role-alerts

View the role alerts currently configured for the server.

##### remove-role-alert

Remove a role alert. Takes the following arguments:
- role (required) : The role for which to remove an alert. -->


### lunar-link

Allows a user to link a wallet to their discord account. Upon using lunar-link, the user will be sent a link to the lunar assistant website from which they can sign a transaction that proves ownership of the wallet they are registering.

For now a user can only have a single wallet registered at a time. Running lunar-link multiple times will overwrite the users existing wallet.

Upon linking a new wallet, the user's roles are updated to reflect the contents of the new wallet.

### lunar-view-roles

Forces a role update based on the contents of a user's linked wallet, then displays the roles that a user is granted. Takes the following arguments:
- private-response (optional, false by default): Indicate whether or not you want to make the response viewable to everyone or just yourself.
### lunar-view-wallet

Displays the wallet a user has linked to their account (only visible to the user who sent the command).

### lunar-disconnect-wallet

Disconnects the user's discord account from their wallet address.


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
- Terrasaurs contract: `terra16h5elefh6y054a6tjvkw5zknlvnytw5rt842rc`
- Terra Cards contract: `terra1zjdkagfvxxvk7grq7c5gk5h3xfvevftyrqc2vd`
- The Survarian contract: `terra1pucsnnskzhljpex9h4zrwj93x27zk2ycw8yxsr`
- LunaLapin contract: `terra1kekvz7nm8ed2nd8mdny8ukuap00mg52txrnwhs`
- Terra Moonshroom contract: `terra1ze929nrf0k2mccgjaj5k9qzsrc7awwcls2fvy5`
- Mondo Immaginario contract: `terra1myw4avsyhzjz0ulg36stayupj5f90phs0nl59s`
- Luna Meow contract: `terra1ce6jq4da4u49x5mwfdun9jxz5az5uflsgqc067`
- LunaBulls contract: `terra1trn7mhgc9e2wfkm5mhr65p3eu7a2lc526uwny2`
- LunaKittys contract: `terra1xyu4hzx90s262tw3rl3u4563xqxtjuyu3lxp4s`
- The Survarian contract: `terra15094m5slnuq00f0kldcspe2n7fj57jzpy2523d`
- SpaceLoot contract: `terra13qrc9j00lk3x0rvpptzdmwtckfj64d5g6xnrv9`
- Luna LLamas contract: `terra1ymqxz9xu80nsp56azqpu8j94646tpkc8xxxy6w`
- Baby Wolf By AndyCraft contract: `terra10vtzvyphvmscs48pmvl4w9nvnz7x2kc0nxe852`
- Galactic Punk contract: `terra103z9cnqm8psy0nyxqtugg6m7xnwvlkqdzm4s4k`
- Wat Da Pug contract: `terra12m4zhl4eqy2dkw863k3nfazxwj6vys007ur57r`
- Terra Waifu contract: `terra1f0fxa2zsrgvmtpqzc4pn288mkg6sp60trx7xwe`
- TerraWhales contract: `terra1jdt2wnfhgy4ptk6m5kxacyj0k6e8rc7e2ugulz`
- Terrapins contract: `terra1f89xq3qhu98v4jch4y5xcrkhl9gytrne99x74t`
- TerraNova contract: `terra1er46zkkqu4fvjdkh6pyw3hprm68c7sdu9yt3e5`
- Bag of D*cks contract: `terra1f5yu534nyzhpkswnx2036wv7fvscxwq42mrnw2`
- Dear..lunatic contract: `terra1k0rkwe4ch874eqawp5ajujtzaypnncqw7mr4hu`
- TerraBuds contract: `terra1qdvv4maeur6k46ufxramp3fpx07jjz7q8dqr5q`
- AvocaDo Kwon contract: `terra1rkw8uvaq80psscttum92vjvgr9lrq0qe0m5paa`
- Luna Kiddy contract: `terra1r9x26yxkugmv5x7u9082cgapd6fusv4q0lz4fj`
- Astroverse contract: `terra18687vy2pch76l03mv8g8m9lmhqlt56qnx42yqp`
- Styllar contract: `terra1934kn7p03ns94htl75zpzsg0n4yvw8yf2746ep`
- Space Toadz contract: `terra1ycp3azjymqckrdlzpp88zfyk6x09m658c2c63d`
- LunaLambos contract: `terra17tjd0c42c5067ykva652uj2445w976frz7yv73`
- wagmiMonkeez contract: `terra1jp5fjj7rlc0erw4z3qr5zuvmg2w49pfzyhvsnk`
- TerraBulls contract: `terra1qn676uss04s68zqr9aq0379q2ln5w9plrz3ukc`
- Terranauts contract: `terra1whyze49j9d0672pleaflk0wfufxrh8l0at2h8q`
- Terranime Punks contract: `terra18g7zaxuju84qzr70sslw4ahjmaehetsg0fd0y9`
- Red Eyed Space Tadpoles contract: `terra12kn3xju6ha6wf9pza3g0phatwzvezratt3wrt5`
- LunArt contract: `terra1flwpxxfl8ldxhdgzxkwet2r37c45hutapgjwkg`
- TNS contract: `terra1cvgy83u5nawj2tg60hl9k0e707hnwj627x20m5`
