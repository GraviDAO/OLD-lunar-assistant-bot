import { GuildMember, Role } from "discord.js";

export const updateAddedPersistedRemovedRoles = (
  guildId: string,
  member: GuildMember,
  activeRoles: { [guildId: string]: Role[] },
  inactiveRoles: { [guildId: string]: Role[] },
  addedRoles: { [guildId: string]: Role[] },
  persistedRoles: { [guildId: string]: Role[] },
  removedRoles: { [guildId: string]: Role[] }
) => {
  for (const role of activeRoles[guildId]) {
    const hasRole = // Check if member exists and has the role
      member.roles.cache.some((role) => role.id === role.id);

    if (hasRole) {
      if (persistedRoles[guildId]) {
        persistedRoles[guildId].push(role);
      } else {
        persistedRoles[guildId] = [role];
      }
    } else {
      if (addedRoles[guildId]) {
        addedRoles[guildId].push(role);
      } else {
        addedRoles[guildId] = [role];
      }
    }
  }

  for (const role of inactiveRoles[guildId]) {
    const hasRole = // Check if member exists and has the role
      member.roles.cache.some((role) => role.id === role.id);

    if (hasRole) {
      if (removedRoles[guildId]) {
        removedRoles[guildId].push(role);
      } else {
        removedRoles[guildId] = [role];
      }
    }
  }
};

// export const updateActiveInactiveRoles = (
//   guildId: string,
//   newRoleId: string,
//   ruleQualifies: boolean,
//   hasRole: boolean,
//   addedRoles: { [guildName: string]: string[] },
//   persistedRoles: { [guildName: string]: string[] },
//   removedRoles: { [guildName: string]: string[] }
// ) => {
//   // If ruleQualifies and user doesn't have role, add to addedRoles
//   // If ruleQualifies and user does have the role, add to persistingRoles
//   // If !ruleQualifies and user does have role, add to removedRoles

//   // addedRoles and persistingRoles and removedRoles may have duplicates
//   // remove duplicates with set and then
//   // remove persisted roles from removed roles

//   if (ruleQualifies && !hasRole) {
//     // ruleQualifies and the user doesn't have the role, so add the role
//     // the user matches the role rules, update accordingly

//     // update activeRoles
//     if (addedRoles[guildId]) {
//       addedRoles[guildId].push(newRoleId);
//     } else {
//       addedRoles[guildId] = [newRoleId];
//     }
//   } else if (ruleQualifies && hasRole) {
//     // ruleQualifies and the user has the role, so persist the role

//     // update activeRoles
//     if (persistedRoles[guildId]) {
//       persistedRoles[guildId].push(newRoleId);
//     } else {
//       persistedRoles[guildId] = [newRoleId];
//     }
//   } else if (!ruleQualifies && hasRole) {
//     // !ruleQualifies and the user has the role, so remove it

//     // update removedRoles
//     if (removedRoles[guildId]) {
//       removedRoles[guildId].push(newRoleId);
//     } else {
//       removedRoles[guildId] = [newRoleId];
//     }
//   } else {
//     // !ruleQualifies and !hasRole so don't do anything
//   }
// };
