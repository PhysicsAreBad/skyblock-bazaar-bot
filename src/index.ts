import 'dotenv/config'

import { Client } from '@zikeji/hypixel'

import { open } from 'lmdb'

import DiscordBot from './discord-bot'
import { getFormattedDate } from './bazaar-utils'

main();

async function main() {
    console.log("Bazaar Tracking Bot v1")
    const client = new Client(process.env.HYPIXEL_TOKEN as string)

    const database = open({
        path: 'trading_database',
    });

    const discordBot = new DiscordBot(database);

    console.log('Starting Hypixel API scanner')
    while (true) {
        const bazaarData = await client.skyblock.bazaar();

        console.log(`Updating Ticker -  ${getFormattedDate()}`)

        discordBot.updateServers(bazaarData)
        
        await new Promise(r => setTimeout(r, 60000));
    }
}