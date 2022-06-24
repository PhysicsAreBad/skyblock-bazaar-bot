import { SlashCommandBuilder } from '@discordjs/builders'
import { CommandInteraction } from 'discord.js';

import { RootDatabase } from 'lmdb';

const command: DiscordCommand = {
	data: new SlashCommandBuilder()
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
        ),
	async execute(interaction: CommandInteraction, database: RootDatabase) {
        
	},
};

export default command