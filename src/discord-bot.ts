import { Client, TextChannel, Intents, MessageEmbed } from 'discord.js'
import { REST } from '@discordjs/rest'
import { Routes } from 'discord-api-types/v10'
import { SlashCommandBuilder } from '@discordjs/builders'

import { RootDatabase } from 'lmdb'

import { ServerData, getFormattedDate, Config } from './bazaar-utils'
import { Components } from '@zikeji/hypixel'
import { ResultObject } from '@zikeji/hypixel/dist/util/ResultObject'

class DiscordBot {
    client: Client
    database: RootDatabase

    constructor(database: RootDatabase, config: Config) {
        console.log("Starting Discord Bot")
    
        this.client = new Client({
            intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_MEMBERS]
        });

        this.client.login(config.discordToken)

        this.addSlashCommands(config.discordToken, config.clientID)

        this.database = database

        this.client.on('ready', () => {
            database.getKeys().forEach(async server => {
                const data: ServerData = database.get(server);

                const channel = await this.client.channels.fetch(data.alertChannel);
                if (channel != null) {
                    (channel as TextChannel).send("Logged In!")
                }
            })
        })

        this.client.on('interactionCreate', async interaction => {
            if (!interaction.isCommand()) return;
            if (interaction.guildId == null) return;

            const { commandName } = interaction;

            console.log(`Processing Command ${commandName}`)

            switch (commandName) {
                case "settickerchannel":
                    if (database.getKeys().asArray.includes(interaction.guildId)) {
                        const data: ServerData = database.get(interaction.guildId)
                        data.tickerChannel = interaction.channelId
                        await database.put(interaction.guildId, data)
                    } else {
                        const data: ServerData = {
                            tickerChannel: interaction.channelId,
                            alertChannel: interaction.channelId,
                            trackedItems: []
                        }
                        await database.put(interaction.guildId, data)
                        console.log(`Created data for guild ${interaction.guildId}`) 
                    }
                    console.log(`Set the ticker channel to ${interaction.channelId} for guild ${interaction.guildId}`)
                    interaction.reply('Set the ticker channel :)')
                    break
                case "setalertchannel":
                    if (database.getKeys().asArray.includes(interaction.guildId)) {
                        const data: ServerData = database.get(interaction.guildId)
                        data.alertChannel = interaction.channelId
                        await database.put(interaction.guildId, data)
                    } else {
                        const data: ServerData = {
                            tickerChannel: interaction.channelId,
                            alertChannel: interaction.channelId,
                            trackedItems: []
                        }
                        await database.put(interaction.guildId, data)
                        console.log(`Created data for guild ${interaction.guildId}`) 
                    }
                    console.log(`Set the alert channel to ${interaction.channelId} for guild ${interaction.guildId}`)
                    interaction.reply('Set the alert channel :)')
                    break
                case "product":
                    const options = interaction.options;
                    if (!database.getKeys().asArray.includes(interaction.guildId)) {
                        interaction.reply('You must set your ticker channel before using this command!')
                        break;
                    }
                    const data: ServerData = database.get(interaction.guildId)
                    let productName: string
                    switch (options.getSubcommand()) {
                        case 'add':
                            productName = options.getString("name", true)
                            data.trackedItems.push(productName)
                            await database.put(interaction.guildId, data)
                            interaction.reply(`Added item ${productName} to the tracked products list`)
                            break
                        case 'remove':
                            productName = options.getString("name", true)
                            if (data.trackedItems.includes(productName)) {
                                data.trackedItems.splice(data.trackedItems.indexOf(productName))
                                await database.put(interaction.guildId, data)
                                interaction.reply(`Removed item ${productName} from the tracked products list`)
                            } else {
                                interaction.reply(`${productName} was not being tracked!`)
                            }
                            break
                        case 'list':
                            interaction.reply(`Current Tracked Products: ${data.trackedItems}`)
                    }
            }
        })
    }

    updateTicker(products: ResultObject<Components.Schemas.SkyBlockBazaarResponse, ["products"]>) {
        this.database.getKeys().asArray.forEach(async server => {
            const data: ServerData = this.database.get(server)
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
        const commands: any[] = []

        commands.push(new SlashCommandBuilder()
            .setName("settickerchannel")
            .setDescription("Sets the current channel as the ticker channel")
            .addChannelOption(option =>
                option.setName("channel").setDescription("The ticker channel").setRequired(true)
            ))
        commands.push(new SlashCommandBuilder()
            .setName("setalertchannel")
            .setDescription("Sets the current channel as the alert channel")
            .addChannelOption(option =>
                option.setName("channel").setDescription("The alert channel").setRequired(true)
            ))

        commands.push(new SlashCommandBuilder()
            .setName("product")
            .setDescription("Add or Subtract products")
            .addSubcommand(command =>
                command.setName('add').setDescription('Add a product').addStringOption(option => option
                    .setName("name")
                    .setDescription("Product Name")
                    .setRequired(true)))
            .addSubcommand(command =>
                command.setName('remove').setDescription('Remove a product').addStringOption(option => option
                    .setName("name")
                    .setDescription("Product Name")
                    .setRequired(true)))
            .addSubcommand(command => 
                command.setName('list').setDescription('Lists all the tracked products')
            ))

        commands.push(new SlashCommandBuilder()
            .setName("alert")
            .setDescription("Add or Subtract alerts")
            .addSubcommand(command =>
                command.setName('add').setDescription('Add an alert').addStringOption(option => option
                    .setName("name")
                    .setDescription("Product Name")
                    .setRequired(true)))
            .addSubcommand(command =>
                command.setName('remove').setDescription('Remove an alert').addStringOption(option => option
                    .setName("name")
                    .setDescription("Product Name")
                    .setRequired(true)))
            .addSubcommand(command => 
                command.setName('list').setDescription('Lists all the alerts')
            ))

        const rest = new REST({ version: '10' }).setToken(token);

        rest.put(Routes.applicationCommands(clientID), {
            body: commands
        })
    }

}

export default DiscordBot