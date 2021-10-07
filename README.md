# Lunar Assistant Bot

This repo contains the lunar assistant discord bot. It provides the following slash commands: 
- lunar-configure
- lunar-link
- lunar-verify
- lunar-display-wallet
## Setup

Copy the `config.json.example` to `config.json` and populate the values.

## Usage

```
npm install
tsc
node dist/src/index.js
```

## Example Addresses For Testing

// punk contract
// terra103z9cnqm8psy0nyxqtugg6m7xnwvlkqdzm4s4k

// lapin contract
// terra1kekvz7nm8ed2nd8mdny8ukuap00mg52txrnwhs

// const addressMapping: { [key: string]: GuildConfig } = {
//   // dev server -> lapin address
//   // "893186947932094524": "terra1kekvz7nm8ed2nd8mdny8ukuap00mg52txrnwhs",
// };
// terra1xa267j4vqxqxe7xmwnwsusfnpmhhwu5asqvge6

// "terra13ed80hm5ay0c2fjcwstg6ca7973w2wz85fffqp"
// "terra1qtqynxctnef434pnaggqkl9yh3lyzqyz53xlqu",