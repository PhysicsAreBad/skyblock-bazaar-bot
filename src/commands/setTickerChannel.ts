import { SlashCommandBuilder } from '@discordjs/builders'
import { ColorResolvable, CommandInteraction, GuildMemberRoleManager, MessageEmbed, Permissions } from 'discord.js';
import { Collection, Document } from 'mongodb';

import messages from '../messages.json'

const command: DiscordCommand = {
	data: new SlashCommandBuilder()
        .setName("settickerchannel")
        .setDescription("Sets the current channel as the ticker channel")
        .addChannelOption(option =>
            option.setName("channel").setDescription("The ticker channel").setRequired(true)
        ),
	async execute(interaction: CommandInteraction, database: Collection<Document>) {
        if (interaction.guildId == null) return;

        const channel = interaction.options.getChannel("channel", true);

		if (await database.findOne({ serverID: interaction.guildId })) {
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

            if(!interaction.guild?.me?.permissionsIn(channel.id).has(Permissions.FLAGS.SEND_MESSAGES)) {
                const embed = new MessageEmbed().setTitle(messages.error.title)
                    .setColor(messages.error.color as ColorResolvable)
                    .setDescription(messages.error.noMessagePerms)
                    .setTimestamp()

                interaction.reply({ embeds: [embed], ephemeral: true})
                return;
            }

            data.tickerChannel = channel.id
            await database.replaceOne({ serverID: interaction.guildId }, data)
        } else {

            if (!interaction.memberPermissions?.has(Permissions.FLAGS.ADMINISTRATOR)) {
                const embed = new MessageEmbed().setTitle(messages.error.title)
                    .setColor(messages.error.color as ColorResolvable)
                    .setDescription(messages.error.adminError)
                    .setTimestamp()

                interaction.reply({ embeds: [embed], ephemeral: true})
                return;
            }

            if(!interaction.guild?.me?.permissionsIn(channel.id).has(Permissions.FLAGS.SEND_MESSAGES)) {
                const embed = new MessageEmbed().setTitle(messages.error.title)
                    .setColor(messages.error.color as ColorResolvable)
                    .setDescription(messages.error.noMessagePerms)
                    .setTimestamp()

                interaction.reply({ embeds: [embed], ephemeral: true})
                return;
            }

            const data: ServerData = {
                serverID: interaction.guildId,
                tickerChannel: channel.id,
                alertChannel: channel.id,
                controlRole: undefined,
                trackedItems: [],
                alerts: []
            }

            await database.insertOne(data)
            console.log(`Created data for guild ${interaction.guildId}`) 
        }
        console.log(`Set the ticker channel to ${channel.id} for guild ${channel.id}`)
        const embed = new MessageEmbed().setTitle("Set Ticker Channel")
            .setColor(messages.success.color as ColorResolvable)
            .addFields(
                { name: 'Channel Name', value: channel.name, inline: true},
                { name: 'Channel ID', value: channel.id, inline: true})
            .setTimestamp()

        interaction.reply({ embeds: [embed], ephemeral: true})
	},
};

export default command