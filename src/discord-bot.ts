import {promises as fs} from 'fs';
import path from 'path';

import { Client, TextChannel, Intents, MessageEmbed, Collection } from 'discord.js'
import { REST } from '@discordjs/rest'
import { Routes } from 'discord-api-types/v10'

import { RootDatabase } from 'lmdb'

import { getFormattedDate } from './bazaar-utils'
import { Components } from '@zikeji/hypixel'
import { ResultObject } from '@zikeji/hypixel/dist/util/ResultObject'

class DiscordBot {
    client: Client
    database: RootDatabase
    commands: Collection<string, DiscordCommand>

    constructor(database: RootDatabase, config: Config) {
        console.log("Starting Discord Bot")
    
        this.client = new Client({
            intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_MEMBERS]
        });

        this.client.login(config.discordToken)

        this.database = database

        this.commands = new Collection()

        const initCommands = async() => {
            const commandsPath = path.join(__dirname, 'commands');
            const commandFiles = (await fs.readdir(commandsPath)).filter(file => file.endsWith('.js'));

            for (const file of commandFiles) {
	            const filePath = path.join(commandsPath, file);
	            const command: DiscordCommand = await require(filePath).default;
	            // Set a new item in the Collection
	            // With the key as the command name and the value as the exported module
	            this.commands.set(command.data.name, command);
            }

            this.addSlashCommands(config.discordToken, config.clientID)
        }
        initCommands()

        this.client.on('ready', () => {
            database.getKeys().forEach(async server => {
                const data: ServerData = database.get(server);

                const channel = await this.client.channels.fetch(data.alertChannel);
                if (channel != null) {
                    const embed = new MessageEmbed().setTitle("Online!")
                        .setDescription(`The Bazaar Tracker logged on at ${getFormattedDate()}`)
                        .setTimestamp();

                    (channel as TextChannel).send({embeds: [embed]})
                }
            })
        })

        this.client.on('interactionCreate', async interaction => {
            if (!interaction.isCommand()) return;
            if (interaction.guildId == null) return;

            const command = this.commands.get(interaction.commandName);

            if (command == null) return;

            console.log(`Processing Command ${command.data.name}`)

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

    updateTicker(products: ResultObject<Components.Schemas.SkyBlockBazaarResponse, ["products"]>) {
        this.database.getKeys().asArray.forEach(async server => {
            const data: ServerData = this.database.get(server)
            if (data.trackedItems.length == 0) return;

            const channel = await this.client.channels.fetch(data.tickerChannel)
            if (channel != null) {
                const textChannel = channel as TextChannel
                textChannel.send(`TICKER UPDATE FOR ${getFormattedDate()}`)
                data.trackedItems.forEach(item => {
                    const embed = new MessageEmbed()
                        .setTitle(item)
                        .setDescription(`Bazaar Ticker`)
                        .addFields(
                            {name: 'Buy Price:', value: `${products[item].quick_status.buyPrice}`, inline: true},
                            {name: 'Sell Price:', value: `${products[item].quick_status.sellPrice}`, inline: true}
                        )
                        .setTimestamp()
                    textChannel.send({embeds: [embed]})
                })
            }
        });
    }

    private addSlashCommands(token: string, clientID: string) {
        const commandData: any[] = []

        for (const command of this.commands.values()) {
            commandData.push(command.data.toJSON())
        }

        const rest = new REST({ version: '10' }).setToken(token);

        rest.put(Routes.applicationCommands(clientID), {
            body: commandData
        })
    }

}

export default DiscordBot