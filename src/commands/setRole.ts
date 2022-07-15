import { SlashCommandBuilder } from '@discordjs/builders'
import { ColorResolvable, CommandInteraction, MessageEmbed, Permissions } from 'discord.js';
import { Collection, Document } from 'mongodb';

import messages from '../messages.json'

const command: DiscordCommand = {
	data: new SlashCommandBuilder()
        .setName("setrole")
        .setDescription("Sets the specified role as the one with access to the bot")
        .addRoleOption(option =>
            option.setName("role").setDescription("The role to use this bot").setRequired(true)
        )
        .setDefaultMemberPermissions(Permissions.FLAGS.ADMINISTRATOR),
	async execute(interaction: CommandInteraction, database: Collection<Document>) {
        if (interaction.guildId == null) return;

        const role = interaction.options.getRole("role", true);

        //Only server admins can change the control role
        if (!interaction.memberPermissions?.has(Permissions.FLAGS.ADMINISTRATOR)) {
            const embed = new MessageEmbed().setTitle(messages.error.title)
                .setColor(messages.error.color as ColorResolvable)
                .setDescription(messages.error.adminOnlyError)
                .setTimestamp()

            interaction.reply({ embeds: [embed], ephemeral: true})
            return;
        }

        if (!(await database.findOne({ serverID: interaction.guildId }))) {
            const embed = new MessageEmbed()
                .setTitle(messages.error.title)
                .setColor(messages.error.color as ColorResolvable)
                .setDescription(messages.error.setTickerError)

            interaction.reply({embeds: [embed], ephemeral: true})
            return;
        }

		const data: ServerData = await database.findOne({ serverID: interaction.guildId }) as unknown as ServerData
        data.controlRole = role.id
        await database.replaceOne({ serverID: interaction.guildId }, data)
        console.log(`Set the alert role to ${role.id} for guild ${interaction.guildId}`)

        const embed = new MessageEmbed().setTitle("Set Role")
            .setColor(messages.success.color as ColorResolvable)
            .addFields(
                { name: 'Role Name', value: role.name, inline: true},
                { name: 'Role ID', value: role.id, inline: true})
            .setTimestamp()

        interaction.reply({ embeds: [embed], ephemeral: true})
	},
};

export default command