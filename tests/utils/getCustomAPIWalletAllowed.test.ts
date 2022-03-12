import { getCustomAPIWalletAllowed } from "../../src/utils/getCustomAPIWalletAllowed"

test('get API Response: Allowed', async () => {
    getCustomAPIWalletAllowed("https://stations.levana.finance/api/factions/free-martians?wallet=$(wallet)", "terra18nxhzmg6733r93wes7d75udfmdhr9uze0ka4rd").then(data => {
        expect(data).toEqual(true);
    })
});

test('get API Response: Not Allowed', async () => {
    getCustomAPIWalletAllowed("https://stations.levana.finance/api/factions/council?wallet=$(wallet)", "terra18nxhzmg6733r93wes7d75udfmdhr9uze0ka4rd").then(data => {
        expect(data).toEqual(false);
    })
});

test('get API Response: error -> Not Allowed', async () => {
    //URL is wrong HTTP error 404 will be returned
    getCustomAPIWalletAllowed("https://stations.levana.finance/api/factions/freeans?wallet=$(wallet)", "terra18nxhzmg6733r93wes7d75udfmdhr9uze0ka4rd").then(data => {
        expect(data).toEqual(false);
    })
});

//todo: add tests to validate inputs
