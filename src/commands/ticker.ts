import { SlashCommandBuilder } from '@discordjs/builders'
import { ColorResolvable, CommandInteraction, GuildMemberRoleManager, MessageEmbed, Permissions } from 'discord.js';
import { Collection, Document } from 'mongodb';

import { getKeyforValue } from '../bazaar-utils'
import itemNames from '../items.json'

import messages from '../messages.json'

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
	async execute(interaction: CommandInteraction, database: Collection<Document>) {
        if (interaction.guildId == null) return;

        const options = interaction.options;
        if (!(await database.findOne({ serverID: interaction.guildId }))) {
            const embed = new MessageEmbed()
                .setTitle(messages.error.title)
                .setColor(messages.error.color as ColorResolvable)
                .setDescription(messages.error.setTickerError)

            interaction.reply({embeds: [embed], ephemeral: true})
            return;
        }
        const data: ServerData = await database.findOne({ serverID: interaction.guildId }) as unknown as ServerData

        if (!(interaction.memberPermissions?.has(Permissions.FLAGS.ADMINISTRATOR) 
        || (data.controlRole ? (interaction.member?.roles as GuildMemberRoleManager).cache.has(data.controlRole) : false))) {
            const embed = new MessageEmbed().setTitle(messages.error.title)
                .setColor(messages.error.color as ColorResolvable)
                .setDescription(messages.error.adminError)
                .setTimestamp()

            interaction.reply({ embeds: [embed], ephemeral: true})
            return;
        }

        let productName: string
        let formattedName: string
        switch (options.getSubcommand()) {
            case 'add':
                productName = options.getString("name", true)

                if (!(productName in itemNames)) {
                    const name = getKeyforValue(productName)
                    if (name != undefined) {
                        productName = name
                    } else {
                        const embed = new MessageEmbed().setTitle(messages.error.title)
                            .setColor(messages.error.color as ColorResolvable)
                            .setDescription(messages.error.notValidItem)
                            .setTimestamp()
                        interaction.reply({ embeds: [embed], ephemeral: true})
                        return;
                    }
                }

                formattedName = itemNames[productName as keyof typeof itemNames]

                data.trackedItems.push(productName)
                await database.replaceOne({ serverID: interaction.guildId }, data)
                const embed = new MessageEmbed().setTitle("Added Item")
                            .setColor(messages.success.color as ColorResolvable)
                            .setDescription(`Added ${formattedName} to the tracked items list`)
                            .setTimestamp()
                interaction.reply({ embeds: [embed], ephemeral: true})
                break
            case 'remove':
                productName = options.getString("name", true)

                if (!(productName in itemNames)) {
                    const name = getKeyforValue(productName)
                    if (name != undefined) {
                        productName = name
                    } else {
                        const embed = new MessageEmbed().setTitle(messages.error.title)
                            .setColor(messages.error.color as ColorResolvable)
                            .setDescription(messages.error.notValidItem)
                            .setTimestamp()
                        interaction.reply({ embeds: [embed], ephemeral: true})
                        return;
                    }
                }

                formattedName = itemNames[productName as keyof typeof itemNames]

                if (data.trackedItems.includes(productName)) {
                    data.trackedItems.splice(data.trackedItems.indexOf(productName), 1)
                    await database.replaceOne({ serverID: interaction.guildId }, data)
                    const embed = new MessageEmbed().setTitle("Removed Item")
                            .setColor(messages.success.color as ColorResolvable)
                            .setDescription(`Removed ${formattedName} from the tracked items list`)
                            .setTimestamp()
                    interaction.reply({ embeds: [embed], ephemeral: true})
                } else {
                    const embed = new MessageEmbed().setTitle(messages.error.title)
                            .setColor(messages.error.color as ColorResolvable)
                            .setDescription(messages.error.notBeingTracked)
                            .setTimestamp()
                    interaction.reply({ embeds: [embed], ephemeral: true})
                }
                break
            case 'list':
                const embed2 = new MessageEmbed().setTitle("Items being tracked")
                            .setColor(messages.list.color as ColorResolvable)
                            .setDescription(data.trackedItems.length > 1 ? data.trackedItems.map(item => itemNames[item as keyof typeof itemNames])
                            .reduce((previousValue, currentValue) => {
                                return previousValue += ", " + currentValue;
                            }) : (data.trackedItems.length == 1 ? itemNames[data.trackedItems.toString() as keyof typeof itemNames] : "Nothing!"))
                            .setTimestamp()
                interaction.reply({ embeds: [embed2], ephemeral: true})
        }
	},
};

export default command