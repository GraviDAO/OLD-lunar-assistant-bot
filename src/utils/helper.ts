export function isValidHttpUrl(urlString: string) {
  let url;
  try {
    url = new URL(urlString);
  } catch (_) {
    return false;
  }

  return url.protocol === "http:" || url.protocol === "https:";
}

export const sequentialAsyncMap = async (list: any[], asyncFunction: any) => {
  list.reduce((p, guildRule) => {
    return p.then(() => asyncFunction(guildRule));
  }, new Promise((resolve) => resolve(null)));
};
