import { SlashCommandBuilder } from '@discordjs/builders'
import { CommandInteraction, GuildMemberRoleManager, MessageEmbed, Permissions } from 'discord.js';

import { RootDatabase } from 'lmdb';

const command: DiscordCommand = {
	data: new SlashCommandBuilder()
        .setName("ticker")
        .setDescription("Add or subtract products to the ticker updates")
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
	},
};

export default command