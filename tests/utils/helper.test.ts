import { isValidHttpUrl } from "../../src/utils/helper"

test('Valid URL', async () => {
    expect(isValidHttpUrl("https://stations.levana.finance/api/factions/free-martians?wallet=")).toBe(true);
    expect(isValidHttpUrl("https://app.anchorprotocol.com/earn")).toBe(true);
});

test('Invalid URL', async () => {
    expect(isValidHttpUrl("tps://stations.levana.finance/api/factions/free-martians?wallet=")).toBe(false);
    expect(isValidHttpUrl("")).toBe(false);
    expect(isValidHttpUrl("not a valid url")).toBe(false);
});