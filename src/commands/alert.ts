import { SlashCommandBuilder } from '@discordjs/builders'
import { CommandInteraction, GuildMemberRoleManager, MessageEmbed, Permissions } from 'discord.js';

import { RootDatabase } from 'lmdb';

import { v4 as generateUUID } from 'uuid'

import { getKeyforValue } from '../bazaar-utils'
import itemNames from '../items.json'

const command: DiscordCommand = {
	data: new SlashCommandBuilder()
        .setName("alert")
        .setDescription("Add or Subtract alerts")
        .addSubcommand(command =>
            command.setName('add').setDescription('Add an alert')
                .addStringOption(option => option.setName('item')
                    .setName("name")
                    .setDescription("Item Name")
                    .setRequired(true)
                ).addBooleanOption(option => option
                    .setName("isbuy")
                    .setDescription("True - When the buy price is below an amount | False - When the sell price rises to an amount")
                    .setRequired(true)
                ).addNumberOption(option => option
                    .setName("amount")
                    .setDescription("Price to alert at")
                    .setRequired(true)
                ))
        .addSubcommand(command =>
            command.setName('remove').setDescription('Remove an alert').addStringOption(option => option
                .setName("id")
                .setDescription("Alert ID (Listed using /alert list)")
                .setRequired(true)))
        .addSubcommand(command => 
            command.setName('list').setDescription('Lists all the alerts')
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

        switch (options.getSubcommand()) {
            case 'add':
                let productName = options.getString("name", true)
                let isBuy = options.getBoolean("isbuy", true)
                let amount = options.getNumber("amount", true)

                let formattedName = productName;

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

                let uuid = generateUUID();

                data.alerts.push({
                    uuid: uuid,
                    itemName: productName,
                    amount: amount,
                    isBuy: isBuy
                })

                await database.put(interaction.guildId, data)
                const embed = new MessageEmbed().setTitle("Added Alert")
                            .setColor('#00FF00')
                            .addField('UUID', uuid, true)
                            .addField('Item', formattedName, true)
                            .addField('Amount', `${amount}`, true)
                            .addField('Buy/Sell', isBuy ? 'Buy' : 'Sell', true)
                            .setTimestamp()
                interaction.reply({ embeds: [embed], ephemeral: true})
                break
            case 'remove':
                let givenUUID = options.getString("uuid", true)

                if (data.alerts.map(entry => entry.uuid).find(entry => entry == givenUUID)) {
                    data.alerts = data.alerts.splice(data.alerts.map(entry => entry.uuid).indexOf(givenUUID))
                    const embed = new MessageEmbed().setTitle("Removed Alert")
                        .setColor('#00FF00')
                        .setDescription(`Deleted alert ${givenUUID}`)
                        .setTimestamp()
                    interaction.reply({ embeds: [embed], ephemeral: true})
                } else {
                    const embed = new MessageEmbed().setTitle("Error")
                        .setColor('#FF0000')
                        .setDescription('That is not a valid alert id! Check /alert list')
                        .setTimestamp()
                    interaction.reply({ embeds: [embed], ephemeral: true})
                }
                break
            case 'list':
                const embed2 = new MessageEmbed().setTitle("Active Alerts")
                            .setColor('#0000FF')
                            .setFields(data.alerts.map(entry => {
                                return {
                                    name: `${entry.isBuy ? 'Buy' : 'Sell'} ${itemNames[entry.itemName as keyof typeof itemNames]} ${entry.amount}`,
                                    value: entry.uuid,
                                    inline: true
                                }
                            }))
                            .setTimestamp()
                interaction.reply({ embeds: [embed2], ephemeral: true})
        }
	},
};

export default command