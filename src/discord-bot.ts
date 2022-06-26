import 'dotenv/config'

import { promises as fs } from 'fs';
import path from 'path';

import { Client, TextChannel, Intents, MessageEmbed, Collection } from 'discord.js'
import { REST } from '@discordjs/rest'
import { Routes } from 'discord-api-types/v10'

import { Components } from '@zikeji/hypixel'
import { ResultObject } from '@zikeji/hypixel/dist/util/ResultObject'

import { Collection as MongoCollection, Document } from 'mongodb'

import itemNames from './items.json'

class DiscordBot {
    client: Client
    database: MongoCollection<Document>
    commands: Collection<string, DiscordCommand>

    constructor(database: MongoCollection<Document>) {
        console.log("Starting Discord Bot")
    
        this.client = new Client({
            intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MEMBERS]
        });

        this.client.login(process.env.DISCORD_TOKEN)

        this.database = database

        this.commands = new Collection()

        const initCommands = async() => {
            const commandsPath = path.join(__dirname, 'commands');
            const commandFiles = (await fs.readdir(commandsPath)).filter(file => file.endsWith('.js'));

            for (const file of commandFiles) {
	            const filePath = path.join(commandsPath, file);
	            const command: DiscordCommand = await require(filePath).default;
	            this.commands.set(command.data.name, command);
            }

            this.addSlashCommands()
        }
        initCommands()

        this.client.on('interactionCreate', async interaction => {
            if (!interaction.isCommand()) return;
            if (interaction.guildId == null) return;

            const command = this.commands.get(interaction.commandName);

            if (command == null) return;

	        try {
		        await command.execute(interaction, this.database);
	        } catch (error) {
		        console.error(error);
                const embed = new MessageEmbed()
                    .setTitle("Error")
                    .setDescription("There was an error while executing this command!")
                    .setColor('#ff0000')
                    .setTimestamp()
		        interaction.reply({ embeds: [embed], ephemeral: true });
	        } 
        })
    }

    updateServers(products: ResultObject<Components.Schemas.SkyBlockBazaarResponse, ["products"]>) {
        this.database.aggregate().forEach(document => {
            const data = document as unknown as ServerData
            if (document.trackedItems.length == 0) return;

            const action = async () => {
                const channel = await this.client.channels.fetch(data.tickerChannel)
                if (channel != null) {
                    const textChannel = channel as TextChannel
                    textChannel.send(`TICKER UPDATE`)
                    data.trackedItems.forEach(async item => {
                        const embed = new MessageEmbed()
                            .setTitle(itemNames[item as keyof typeof itemNames])
                            .setDescription(`Bazaar Ticker`)
                            .addFields(
                                {name: 'Buy Order Price:', value: `${products[item].quick_status.sellPrice}`, inline: true},
                                {name: 'Sell Order Price:', value: `${products[item].quick_status.buyPrice}`, inline: true}
                            )
                            .setTimestamp()
                            .setColor('#f0cc05')
                        textChannel.send({embeds: [embed]})
                        //Wait so bot does not get rate limited
                        await new Promise(r => setTimeout(r, 20));
                    })
                }

                const alertChannel = await this.client.channels.fetch(data.alertChannel);
                if (alertChannel != null) {
                    const textChannel = alertChannel as TextChannel
                    data.alerts.forEach(async alert => {
                        if (alert.isBuy) {
                            if (products[alert.itemName].quick_status.sellPrice <= alert.amount) {
                                if (data.controlRole)
                                    textChannel.send(`<@&${data.controlRole}>`)
                                const embed = new MessageEmbed()
                                    .setTitle(`ALERT`)
                                    .setDescription(`${itemNames[alert.itemName as keyof typeof itemNames]} is at or below ${alert.amount}`)
                                    .addFields(
                                        {name: 'Current Buy Price:', value: `${products[alert.itemName].quick_status.sellPrice}`, inline: true}
                                    )
                                    .setTimestamp()
                                    .setColor('#f0cc05')
                                try {
                                    textChannel.send({embeds: [embed]})
                                } catch (e) {
                                    console.error(e)
                                }
                            }
                        } else {
                            if (products[alert.itemName].quick_status.buyPrice >= alert.amount) {
                                const embed = new MessageEmbed()
                                    .setTitle(`ALERT`)
                                    .setDescription(`${itemNames[alert.itemName as keyof typeof itemNames]} is at or above ${alert.amount}`)
                                    .addFields(
                                        {name: 'Current Sell Price:', value: `${products[alert.itemName].quick_status.buyPrice}`, inline: true}
                                    )
                                    .setTimestamp()
                                    .setColor('#f0cc05')
                                try {
                                    textChannel.send({embeds: [embed]})
                                } catch (e) {
                                    console.error(e)
                                }
                            }
                        }
                        //Wait so bot does not get rate limited
                        await new Promise(r => setTimeout(r, 20));
                    })
                }
            }
            action()
        });
    }

    private addSlashCommands() {
        const commandData: any[] = []

        for (const command of this.commands.values()) {
            commandData.push(command.data.toJSON())
        }

        const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN as string);

        rest.put(Routes.applicationCommands(process.env.CLIENTID as string), {
            body: commandData
        })
    }

}

export default DiscordBot