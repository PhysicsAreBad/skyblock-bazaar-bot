# Skyblock Bazaar Tracker

For the intended way to play

[Discord](https://discord.gg/JbUYwMDKAX)

## How to add to your server

### The Easy Way
[Hosted Bot](https://discord.com/api/oauth2/authorize?client_id=989871150471454752&permissions=3072&scope=bot%20applications.commands)

### Self Hosting
1. Install NodeJS and Yarn
2. Run `yarn && yarn build`
3. Input the API keys into process.env, move it into the dist folder, and remove the .example extension
4. Run `yarn start` from the main directory!
5. Celebrate your self hosted bazaar goodness

## How to use

1. Set your alert and ticker channels with `/setalertchannel` and `/settickerchannel` respectivly
2. Add items you would like to track with `/ticker add [item name]`
3. Add alerts with `/alert add`
4. Set the role for others to interact with the bot using `/setrole [role]` (Optional)

## General Info

Updates every minute

Alerts will constant ping every time a condition is met

### Deleting Alerts

Each alert is assigned a UUID so users can easier create multiple alerts for an item. As such, when using `/alert remove` you must specify which alert to remove via it's UUID. You can see the UUID of your specified alerts using `/alert list`

## Wanna Help?

Submit bug reports, contribute code, or offer me a job :p