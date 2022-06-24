import { Client } from '@zikeji/hypixel'

import { promises as fs } from 'fs'

import { open } from 'lmdb'

import DiscordBot from './discord-bot'
import { getFormattedDate } from './bazaar-utils'

main();

async function main() {
    const config: Config = JSON.parse(await fs.readFile('config.json', 'utf-8'))
    console.log("Trading Bot v1")
    //TODO: Key goes here
    const client = new Client(config.hypixelAPIToken)

    const database = open({
        path: 'trading_database',
    });

    const discordBot = new DiscordBot(database, config);

    console.log('Starting Hypixel API scanner')
    while (true) {
        const bazaarData = await client.skyblock.bazaar();

        console.log(`Updating Ticker -  ${getFormattedDate()}`)

        discordBot.updateTicker(bazaarData)
        
        await new Promise(r => setTimeout(r, 60000));
    }
}