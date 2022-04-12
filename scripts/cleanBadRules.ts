import admin, { ServiceAccount } from "firebase-admin";
import fs from "fs";
import { FIREBASE_ADMIN_SERVICE_ACCOUNT } from "../config.json";
import { CW20Rule, GuildConfig, NFTRule } from "../src/shared/firestoreTypes";
import {
  guildRuleToSimpleRule,
  isCW20Rule,
  isNFTRule,
} from "../src/utils/guildRuleHelpers";

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

const badNFTContracts = [
  "$fp terra1x8m8vju636xh7026dehq6g7ye66tn0yu4c7mq8",
  "Terra1fuq5622pn2hwx3h6k2ucc06sthsvuvx5rvlkgq",
  "terra1jml7selud3pmf7s4n0r4kv29jparztavx7upy0",
  "terra1phx36yxnv6muf7frdreq8f85a4tyw4qzpc8ntf",
  "rthrtxhrth",
  "terra12w0u3jx702yc50zw0kuafg3fgxkv2h8cggryx0",
  "terra1my4sy2gt5suu9fgt8wdkm7ywrd5jzg86692as2 role",
  "terra1uv9w7aaq6lu2kn0asnvknlcgg2xd5ts57ss7qt_587",
  "terra1uv9w7aaq6lu2kn0asnvknlcgg2xd5ts57ss7qt?traitFilters%5Bhat%5D=Luna%20Cap",
  "terra1wktqmfd985n4y8us0wcmzhqygt629axrw9j4h4_96611878353654335916476848156990593173",
  "terra15cm8n2uuxea4gkeqsnhr40kzh7z0v9wzmqfkjk",
  "terra15ffta7sxkw2485d5nn07cjuga92wmx7avewc06",
  "/terra1y076t8yrj0t4ag969w92ez9qfdj0c6dn7xhmkq",
  "terra19v9hc9h4dusychswnffs8drhx0sjhhpcfmpmp8",
  "terra12cfad5nyv78asc22h7nsddvm3krel9xdszwlrl",
];

const badCW20Contracts = [
  "placeholder",
];

const cleanBadRules = async () => {
  const guildConfigsSnapshot = await db.collection("guildConfigs").get();

  let backupGuildConfigs = JSON.stringify(
    guildConfigsSnapshot.docs.map((doc) => ({ id: doc.id, data: doc.data() }))
  );

  fs.writeFileSync(`backupguildconfigs${Date.now()}.json`, backupGuildConfigs);

  guildConfigsSnapshot.docs.forEach((guildConfigDoc) => {
    let guildConfig = guildConfigDoc.data() as GuildConfig;

    let deleted: any[] = [];

    let newRules = guildConfig.rules.filter((guildRule) => {
      try {
        const simpleRule = guildRuleToSimpleRule(guildRule);
        if (isNFTRule(simpleRule)) {
          let nftRule = simpleRule as NFTRule;
          if (badNFTContracts.includes(nftRule.nftAddress)) {
            deleted.push(guildRule);
            return false;
          } else {
            return true;
          }
        } else if (isCW20Rule(simpleRule)) {
          let cw20Rule = simpleRule as CW20Rule;
          if (badCW20Contracts.includes(cw20Rule.cw20Address)) {
            deleted.push(guildRule);
            return false;
          } else {
            return true;
          }
        } else { //dont touch api + staked contract rules + future rules
          return true;
        }
      } catch (err) {
        console.log("ERROR reading rule");
        throw new Error("error");
      }
    });

    // Make sure that we aren't going to delete things we don't want to delete
    if (!compareObjects(guildConfig.rules, newRules)) {
      console.log({
        old: guildConfig.rules.map(guildRuleToSimpleRule),
        deleted: deleted.map(guildRuleToSimpleRule),
        new: newRules.map(guildRuleToSimpleRule),
      });
      console.log("Number of old rules: " + guildConfig.rules.length);
      console.log("Number of remaining rules: " + newRules.length);
      console.log("Number of expected rules to delete (unless duplicate rules): " + badNFTContracts.length);
      console.log("Number of deleted rules: " + deleted.length);
    }

    guildConfig.rules = newRules;

    // db.collection("guildConfigs").doc(guildConfigDoc.id).set(guildConfig);
  });
};

cleanBadRules();

function compareObjects(o: any, p: any) {
  var i,
    keysO = Object.keys(o).sort(),
    keysP = Object.keys(p).sort();
  if (keysO.length !== keysP.length) return false; //not the same nr of keys
  if (keysO.join("") !== keysP.join("")) return false; //different keys
  for (i = 0; i < keysO.length; ++i) {
    if (o[keysO[i]] instanceof Array) {
      if (!(p[keysO[i]] instanceof Array)) return false;
      //if (compareObjects(o[keysO[i]], p[keysO[i]] === false) return false
      //would work, too, and perhaps is a better fit, still, this is easy, too
      if (p[keysO[i]].sort().join("") !== o[keysO[i]].sort().join(""))
        return false;
    } else if (o[keysO[i]] instanceof Date) {
      if (!(p[keysO[i]] instanceof Date)) return false;
      if ("" + o[keysO[i]] !== "" + p[keysO[i]]) return false;
    } else if (o[keysO[i]] instanceof Function) {
      if (!(p[keysO[i]] instanceof Function)) return false;
      //ignore functions, or check them regardless?
    } else if (o[keysO[i]] instanceof Object) {
      if (!(p[keysO[i]] instanceof Object)) return false;
      if (o[keysO[i]] === o) {
        //self reference?
        if (p[keysO[i]] !== p) return false;
      } else if (compareObjects(o[keysO[i]], p[keysO[i]]) === false)
        return false; //WARNING: does not deal with circular refs other than ^^
    }
    if (o[keysO[i]] !== p[keysO[i]])
      //change !== to != for loose comparison
      return false; //not the same value
  }
  return true;
}
