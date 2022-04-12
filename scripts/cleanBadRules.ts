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
  "terra1f7w2ry82nf2cmtgpksyeu020z6tpfgmmcpm0u3",
  "terra1gel4vett3uety4xzr5dv4dzewup7knc6h3jmqu",
  "terra1tven5ck3advmrzesy9d472chacvk7rmhv6c8jk",
  "terra1tvcsk8udh4ef6qk9u6j8hfu47ptep0acpnyf94",
  "61f4809bb123364b12d1865",
  "terra1su3tlqcwa09y4800mpwktddmzl0yyqgf4wfg7p",
  "terra1amrl8f5fqen2m478nuh2z7mz5ce096x4xqae9p",
  "61cebf56ed955e48db17ad59",
  "terra1uvy3sjdkxyzp2ypuvr3eqh0kpf2ztxecy9xh74",
  "terra18n2pc9x6q9str9dz8sqpt7ulz5telutclkzaec",
  "terra19wka0vfl493ajupk6dm0g8hsa0nfls0m4vq7zw",
  "61cebf4ced955e48db1792f1",
];

const badCW20Contracts = [
  "terra1flwpxxfl8ldxhdgzxkwet2r37c45hutapgjwkg",
  "terra10f6n78sx84937kcqrthf2gkfxgfjgmxpqrlug7",
  "terra15ym9575des8tgut34enalls6h9m52hjpsw5vxe",
  "terra1ggv86dkuzmky7ww20s2uvm6pl2jvl9mv0z6zyt",
  "terra1y076t8yrj0t4ag969w92ez9qfdj0c6dn7xhmkq",
  "terra1su3tlqcwa09y4800mpwktddmzl0yyqgf4wfg7p",
  "terra1xv0as2esvwqcuaqtdhvrdhykrfe75qw42tgh6f",
  "terra1hs0l9uhmwjyttvhrqnwrvx8qnj8xvtmfuklscl",
  "terra18n2pc9x6q9str9dz8sqpt7ulz5telutclkzaec",
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
