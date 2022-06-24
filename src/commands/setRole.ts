import { SlashCommandBuilder } from '@discordjs/builders'
import { CommandInteraction, MessageEmbed, Permissions } from 'discord.js';

import { RootDatabase } from 'lmdb';

const command: DiscordCommand = {
	data: new SlashCommandBuilder()
        .setName("setrole")
        .setDescription("Sets the specified role as the one with access to the bot")
        .addRoleOption(option =>
            option.setName("role").setDescription("The role to use this bot").setRequired(true)
        )
        .setDefaultMemberPermissions(Permissions.FLAGS.ADMINISTRATOR),
	async execute(interaction: CommandInteraction, database: RootDatabase) {
        if (interaction.guildId == null) return;

        const role = interaction.options.getRole("role", true);

        if (!interaction.memberPermissions?.has(Permissions.FLAGS.ADMINISTRATOR)) {
            const embed = new MessageEmbed().setTitle("Error")
                .setColor('#FF0000')
                .setDescription('You must be an administrator to use this command.')
                .setTimestamp()

            interaction.reply({ embeds: [embed], ephemeral: true})
            return;
        }

        if (!database.getKeys().asArray.includes(interaction.guildId)) {
            const embed = new MessageEmbed()
                .setTitle('Error!')
                .setColor('#ff0000')
                .setDescription('You must set your ticker channel before using this command! Use /settickerchannel')

            interaction.reply({embeds: [embed], ephemeral: true})
            return;
        }

		const data: ServerData = database.get(interaction.guildId)
        data.controlRole = role.id
        await database.put(interaction.guildId, data)
        console.log(`Set the alert role to ${role.id} for guild ${interaction.guildId}`)

        const embed = new MessageEmbed().setTitle("Set Role")
            .setColor('#00FF00')
            .addFields(
                { name: 'Role Name', value: role.name, inline: true},
                { name: 'Role ID', value: role.id, inline: true})
            .setTimestamp()

        interaction.reply({ embeds: [embed], ephemeral: true})
	},
};

export default command