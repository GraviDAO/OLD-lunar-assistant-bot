import { getMessierArtTokens } from "../../src/utils/getMessierArtTokens";

//This test might fail in the future if the wallet address sells any nfts. 
//In that case, just pick another address and adjust the expected data.
test('get 3 token_ids', async () => {
    const expectedData = { "nft": {
             "terra103z9cnqm8psy0nyxqtugg6m7xnwvlkqdzm4s4k": {
               "tokenIds": [
                 "126245826658970484267280781357969183446",
                 "42468172727459672596718759331851037027",
               ],
             },
             "terra13st8tpsfemjd5l09kcwuks9mtnx3qural9m8zh": {
               "tokenIds": [
                 "0191",
                 "1071",
                 "0999",
               ],
             },
             "terra1ycp3azjymqckrdlzpp88zfyk6x09m658c2c63d": {
               "tokenIds": [
                 "482",
                 "505",
                 "723",
                 "3768",
                 "5087",
               ],
             },
             "terra1ygy58urzh826al6ktlskh4z6hnd2aunhcn0cvm": {
               "tokenIds": [
                 "terra.luna.lambo",
                 "wen.terra.lambo",
                 "life.long.ape",
               ],
             },
    }, cw20: {} };
    getMessierArtTokens("terra1x9wn5sl8dndxa9pgclhlr6drp47mysrt4ng7gk").then(data => {
        expect(data).toEqual(expectedData);
    });
});