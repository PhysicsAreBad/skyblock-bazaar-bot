const path = require('path')
require('dotenv').config({
  path: path.resolve(__dirname, 'process.env')
})

import { Client } from '@zikeji/hypixel'

import { MongoClient } from 'mongodb'

import DiscordBot from './discord-bot'
import { getFormattedDate } from './bazaar-utils'

main();

async function main() {
    console.log("Bazaar Tracking Bot v1")
    const client = new Client(process.env.HYPIXEL_TOKEN as string)

    const databaseClient = new MongoClient(process.env.MONGODB as string)
    await databaseClient.connect()

    const database = databaseClient.db('Cluster0').collection('server_data');

    const discordBot = new DiscordBot(database);

    console.log('Starting Hypixel API scanner')
    while (true) {
        const bazaarData = await client.skyblock.bazaar();

        console.log(`Updating Ticker -  ${getFormattedDate()}`)

        discordBot.updateServers(bazaarData)
        
        await new Promise(r => setTimeout(r, 60000));
    }
}