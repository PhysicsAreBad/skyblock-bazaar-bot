import { SlashCommandBuilder } from '@discordjs/builders'
import { CommandInteraction, MessageEmbed} from 'discord.js';
import { Collection, Document } from 'mongodb';

const command: DiscordCommand = {
	data: new SlashCommandBuilder()
        .setName("info")
        .setDescription("Info about Skyblock Bazaar Trader"),
	async execute(interaction: CommandInteraction, database: Collection<Document>) {
        if (interaction.guildId == null) return;

        const embed = new MessageEmbed().setTitle('Info').setDescription('Skyblock Bazaar Trader').addFields(
                {name: 'Author', value: 'PhysicsAreBad', inline: true},
                {name: 'Version', value: 'v1 (Skyblock v.13 June 22 Patch)', inline: true})
            .setURL('https://github.com/PhysicsAreBad/skyblock-bazaar-bot')
            .setTimestamp()
            .setColor('#a810b3')
        
        interaction.reply({ embeds: [embed], ephemeral: true})
    }
};

export default command