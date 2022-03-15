import { FIREBASE_ADMIN_SERVICE_ACCOUNT } from "../../config.json";
import admin, { ServiceAccount } from "firebase-admin";
import { deleteCollection } from "../testUtils";
import { User, GuildConfig, GuildRule } from "../../src/shared/firestoreTypes";

if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(
        FIREBASE_ADMIN_SERVICE_ACCOUNT as ServiceAccount
      ),
    });
  } catch (error) {
    console.error("Firebase admin initialization error", error);
  }
}
const db = admin.firestore();

const guildId = "816338220744441897";
const myUserId = "753254544128868415";
const botUserId = "948311260238348308";
const quantity = 1;
const tokenIds = ["40343736560973043660145744069817165423"];

//test wallets
// galactic punk:   terra1yu9qtszcxrga4s2tjepnckeruxht4q7mtz7m3n
// astro holder:    terra1el8vzzhc6qc2haw2srd4exkjw7f4l08vpwxdkk
// api rule:        terra18nxhzmg6733r93wes7d75udfmdhr9uze0ka4rd

// discord bot test commands:
// /lunar-configure add-nft-rule nft-address: terra103z9cnqm8psy0nyxqtugg6m7xnwvlkqdzm4s4k role: @Galactic Punk quantity: 1 token-ids: ["40343736560973043660145744069817165423"]
// /lunar-configure add-api-rule api-url:https://stations.levana.finance/api/factions/free-martians?wallet=$(wallet) role:@ApiRole 
// /lunar-configure add-cw20-rule cw20-address:terra1xj49zyqrwpv5k928jwfpfy2ha668nwdgkwlrg3 role:@AstroHodler 

/*
// json query smart contract: https://finder.terra.money/columbus-5/address/terra103z9cnqm8psy0nyxqtugg6m7xnwvlkqdzm4s4k
{
    "tokens": {
        "owner": "terra1yu9qtszcxrga4s2tjepnckeruxht4q7mtz7m3n"
    }
}
*/


//setup and populate database with test data to allow basic tests in discord test server
const initDatabase = async () => {

    //cleanup database
    await deleteCollection(db, "users", 10);
    await deleteCollection(db, "guildConfigs", 10);

const apiRule: GuildRule = {
    version: "1.0",
    nft: {},
    cw20: {},
    api: { 
        ["https://stations.levana.finance/api/factions/free-martians?wallet=$(wallet)"]: {}
    },
    nativeToken: {},
    roleId: '950445948100821042',
  };

  const nftRule: GuildRule = {
    version: "1.0",
    nft: {
        ["terra103z9cnqm8psy0nyxqtugg6m7xnwvlkqdzm4s4k"]: {
          ...(tokenIds && { tokenIds }),
          quantity,
        },
      },
    cw20: {},
    api: {},
    nativeToken: {},
    roleId: '950858244631437332',
  };

  const cw20Rule: GuildRule = {
    version: "1.0",
    nft: {},
    cw20: { ["terra1xj49zyqrwpv5k928jwfpfy2ha668nwdgkwlrg3"]: { quantity, }, },
    api: {},
    nativeToken: {},
    roleId: '942896801030225960',
  };

  const guildConfigDoc = await db
  .collection("guildConfigs")
  .doc(guildId)
  .get();
  
  const guildConfig: GuildConfig = guildConfigDoc.exists
    ? (guildConfigDoc.data() as GuildConfig)
    : { rules: [] };
  
  guildConfig.rules.push(apiRule);
  guildConfig.rules.push(nftRule);
  guildConfig.rules.push(cw20Rule);


  const guildBatch = db.batch();
  guildBatch.set(db.collection('guildConfigs').doc(guildId), guildConfig);
  await guildBatch.commit();

  
  const myUser: User = {
    wallet: 'terra18nxhzmg6733r93wes7d75udfmdhr9uze0ka4rd',
  };
  const botUser: User = {
    wallet: 'terra1qprzwjkhxlrke9adez3x7xteyxgm9452m9338z',
  };
 
  const userBatch = db.batch();
  userBatch.set(db.collection('users').doc(myUserId), myUser);
  userBatch.set(db.collection('users').doc(botUserId), botUser);
  await userBatch.commit();

};

initDatabase();
console.log("Database initialized successfully!");