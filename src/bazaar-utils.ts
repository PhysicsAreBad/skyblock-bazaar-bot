export type ServerData = {
    alertChannel: string,
    tickerChannel: string,
    trackedItems: string[]
}

export function getFormattedDate() {
    let d = new Date();

    let dString = d.getFullYear() + "-" + ('0' + (d.getMonth() + 1)).slice(-2) + "-" + ('0' + d.getDate()).slice(-2) + " " + ('0' + d.getHours()).slice(-2) + ":" + ('0' + d.getMinutes()).slice(-2) + ":" + ('0' + d.getSeconds()).slice(-2);

    return dString;
}

export type Config = {
    discordToken: string,
    clientID: string,
    hypixelAPIToken: string
}

