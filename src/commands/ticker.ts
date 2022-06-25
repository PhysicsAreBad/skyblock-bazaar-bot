import { SlashCommandBuilder } from '@discordjs/builders'
import { CommandInteraction, GuildMemberRoleManager, MessageEmbed, Permissions } from 'discord.js';

import { RootDatabase } from 'lmdb';

import { getKeyforValue } from '../bazaar-utils'
import itemNames from '../items.json'

const command: DiscordCommand = {
	data: new SlashCommandBuilder()
        .setName("ticker")
        .setDescription("Add or subtract items to the ticker updates")
        .addSubcommand(command =>
            command.setName('add').setDescription('Add an item').addStringOption(option => option
                .setName("name")
                .setDescription("Item Name")
                .setRequired(true)))
        .addSubcommand(command =>
            command.setName('remove').setDescription('Remove an item').addStringOption(option => option
                .setName("name")
                .setDescription("Item Name")
                .setRequired(true)))
        .addSubcommand(command => 
            command.setName('list').setDescription('Lists all the tracked items')
        ),
	async execute(interaction: CommandInteraction, database: RootDatabase) {
        if (interaction.guildId == null) return;

        const options = interaction.options;
        if (!database.getKeys().asArray.includes(interaction.guildId)) {
            const embed = new MessageEmbed()
                .setTitle('Error!')
                .setColor('#ff0000')
                .setDescription('You must set your ticker channel before using this command! Use /settickerchannel')

            interaction.reply({embeds: [embed], ephemeral: true})
            return;
        }
        const data: ServerData = database.get(interaction.guildId)

        if (!(interaction.memberPermissions?.has(Permissions.FLAGS.ADMINISTRATOR) 
        || (data.controlRole ? (interaction.member?.roles as GuildMemberRoleManager).cache.has(data.controlRole) : false))) {
            const embed = new MessageEmbed().setTitle("Error")
                .setColor('#FF0000')
                .setDescription('You must be either an administrator or given a role to use this bot. If not configured, ask an administrator to use /setrole to set the role for bot use.')
                .setTimestamp()

            interaction.reply({ embeds: [embed], ephemeral: true})
            return;
        }

        let productName: string
        let formattedName: string
        switch (options.getSubcommand()) {
            case 'add':
                productName = options.getString("name", true)

                formattedName = productName;

                if (!(productName in itemNames)) {
                    const name = getKeyforValue(productName)
                    if (name != undefined) {
                        productName = name
                    } else {
                        const embed = new MessageEmbed().setTitle("Error")
                            .setColor('#FF0000')
                            .setDescription('That is not a valid item!')
                            .setTimestamp()
                        interaction.reply({ embeds: [embed], ephemeral: true})
                        return;
                    }
                } else {
                    formattedName = itemNames[productName as keyof typeof itemNames]
                }

                data.trackedItems.push(productName)
                await database.put(interaction.guildId, data)
                const embed = new MessageEmbed().setTitle("Added Item")
                            .setColor('#00FF00')
                            .setDescription(`Added item ${formattedName} to the tracked items list`)
                            .setTimestamp()
                interaction.reply({ embeds: [embed], ephemeral: true})
                break
            case 'remove':
                productName = options.getString("name", true)

                formattedName = productName;

                if (!(productName in itemNames)) {
                    const name = getKeyforValue(productName)
                    if (name != undefined) {
                        productName = name
                    } else {
                        const embed = new MessageEmbed().setTitle("Error")
                            .setColor('#FF0000')
                            .setDescription('That is not a valid item!')
                            .setTimestamp()
                        interaction.reply({ embeds: [embed], ephemeral: true})
                        return;
                    }
                } else {
                    formattedName = itemNames[productName as keyof typeof itemNames]
                }

                if (data.trackedItems.includes(productName)) {
                    data.trackedItems.splice(data.trackedItems.indexOf(productName))
                    await database.put(interaction.guildId, data)
                    const embed = new MessageEmbed().setTitle("Removed Item")
                            .setColor('#00FF00')
                            .setDescription(`Removed item ${formattedName} from the tracked items list`)
                            .setTimestamp()
                    interaction.reply({ embeds: [embed], ephemeral: true})
                } else {
                    const embed = new MessageEmbed().setTitle("Error")
                            .setColor('#FF0000')
                            .setDescription(`${formattedName} was not being tracked!`)
                            .setTimestamp()
                    interaction.reply({ embeds: [embed], ephemeral: true})
                }
                break
            case 'list':
                const embed2 = new MessageEmbed().setTitle("Items being tracked")
                            .setColor('#0000FF')
                            .setDescription(data.trackedItems.map(item => itemNames[item as keyof typeof itemNames])
                            .reduce((previousValue, currentValue) => {
                                return previousValue += ", " + currentValue;
                            }))
                            .setTimestamp()
                interaction.reply({ embeds: [embed2], ephemeral: true})
        }
	},
};

export default command