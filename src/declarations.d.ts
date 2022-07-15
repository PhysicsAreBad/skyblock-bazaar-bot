type Config = {
    discordToken: string,
    clientID: string,
    hypixelAPIToken: string
}

type AlertSchema = {
    uuid: string,
    itemName: string,
    isBuy: boolean //If true, alert on buyPrice, else check sellPrice
    amount: number
}

type ServerData = {
    serverID: string,
    alertChannel: string,
    tickerChannel: string,
    controlRole: string | undefined
    trackedItems: string[],
    alerts: AlertSchema[]
}

type DiscordCommand = {
    data: SlashCommandBuilder
    execute: function(CommandInteraction, RootDatabase, DiscordBot): void
}