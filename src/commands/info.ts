import { SlashCommandBuilder } from '@discordjs/builders'
import { ColorResolvable, CommandInteraction, MessageEmbed} from 'discord.js';

import messages from '../messages.json';

const command: DiscordCommand = {
	data: new SlashCommandBuilder()
        .setName("info")
        .setDescription("Info about Skyblock Bazaar Trader"),
	async execute(interaction: CommandInteraction) {
        if (interaction.guildId == null) return;

        const embed = new MessageEmbed().setTitle('Info').setDescription('Skyblock Bazaar Trader').addFields(
                {name: 'Author', value: 'PhysicsAreBad', inline: true},
                {name: 'Version', value: 'v1.1 (Skyblock v.13 June 22 Patch)', inline: true})
            .setURL('https://github.com/PhysicsAreBad/skyblock-bazaar-bot')
            .setTimestamp()
            .setColor(messages.list.color as ColorResolvable)
        
        interaction.reply({ embeds: [embed], ephemeral: true})
    }
};

export default command