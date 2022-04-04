import { getWalletTokensOfOwner } from "../../src/utils/terraHelpers";

test('verify talis non standard response', async () => {
    //https://finder.extraterrestrial.money/mainnet/contract/terra1snlvfux3c0yug5f60txwd3penvnvmlfdx2lcq8
    const expected = { tokens: ["7","408"] };
    const response  = await getWalletTokensOfOwner("terra1ymc59uuuklnudfnkwhezzlnmec6f3cze7tsve9", "terra1snlvfux3c0yug5f60txwd3penvnvmlfdx2lcq8");
    console.log("response: " + JSON.stringify(response));
    expect(response).toEqual(expected);
})

test('verify standard response', async () => {
    //https://finder.extraterrestrial.money/mainnet/contract/terra1l0l94sue40fmutzga4lhszzkyj5pj9e6qjypsh
    const expected = { tokens: ["13660","16311","16548","18390","20414","20626","21293","21450","21947","25111","25741","26424","28506","31217","33667","36839","37284","39767","42436","44403","45649","45697","47230","47961","48310",] };
    const response  = await getWalletTokensOfOwner("terra125ryruw9ps9km3wg9vjfksrxw30tcpdchwkzx7", "terra1l0l94sue40fmutzga4lhszzkyj5pj9e6qjypsh");
    console.log("response: " + JSON.stringify(response));
    expect(response).toEqual(expected);
})

//do a test for the almost standard talis response