import itemList from './items.json'

export function getFormattedDate() {
    let d = new Date();

    let dString = d.getFullYear() + "-" + ('0' + (d.getMonth() + 1)).slice(-2) + "-" + ('0' + d.getDate()).slice(-2) + " " + ('0' + d.getHours()).slice(-2) + ":" + ('0' + d.getMinutes()).slice(-2) + ":" + ('0' + d.getSeconds()).slice(-2);

    return dString;
}

export function getKeyforValue(value: string): string | undefined {
    for (let key in itemList) {
        if(itemList[key as keyof typeof itemList] == value) {
            return key;
        }
    }
    return undefined;
}
