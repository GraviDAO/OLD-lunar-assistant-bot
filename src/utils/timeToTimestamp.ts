export const timeToTimestamp = (
  string: string,
): number => {
  return string.split(",").map((v: string) => {
    const number = parseInt(v);
    const interval = v.replace(number.toString(), "");
    switch (interval.toLowerCase()) {
      case "m":
        return number * 1000 * 60;
      case "h":
        return number * 1000 * 60 * 60;
      case "d":
        return number * 1000 * 60 * 60 * 24;
    }
  }).reduce((prev: number | undefined, curr: number | undefined) => {
    return (prev ?? 0) + (curr ?? 0);
  }, Date.now()) ?? 0;
};
