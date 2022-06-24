type Config = {
    discordToken: string,
    clientID: string,
    hypixelAPIToken: string
}

type ServerData = {
    alertChannel: string,
    tickerChannel: string,
    controlRole: string | undefined
    trackedItems: string[]
}

type DiscordCommand = {
    data: SlashCommandBuilder
    execute: function(CommandInteraction, RootDatabase): void
}