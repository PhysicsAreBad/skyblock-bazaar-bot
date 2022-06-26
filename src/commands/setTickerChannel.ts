import { SlashCommandBuilder } from '@discordjs/builders'
import { CommandInteraction, GuildMemberRoleManager, MessageEmbed, Permissions } from 'discord.js';
import { Collection, Document } from 'mongodb';

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
                const embed = new MessageEmbed().setTitle("Error")
                    .setColor('#FF0000')
                    .setDescription('You must be either an administrator or given a role to use this bot. If not configured, ask an administrator to use `/setrole` to set the role for bot use.')
                    .setTimestamp()

                interaction.reply({ embeds: [embed], ephemeral: true})
                return;
            }

            data.tickerChannel = channel.id
            await database.replaceOne({ serverID: interaction.guildId }, data)
        } else {

            if (!interaction.memberPermissions?.has(Permissions.FLAGS.ADMINISTRATOR)) {
                const embed = new MessageEmbed().setTitle("Error")
                    .setColor('#FF0000')
                    .setDescription('You must be either an administrator or given a role to use this bot. If not configured, ask an administrator to use `/setrole` to set the role for bot use.')
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
            .setColor('#00FF00')
            .addFields(
                { name: 'Channel Name', value: channel.name, inline: true},
                { name: 'Channel ID', value: channel.id, inline: true})
            .setTimestamp()

        interaction.reply({ embeds: [embed], ephemeral: true})
	},
};

export default command