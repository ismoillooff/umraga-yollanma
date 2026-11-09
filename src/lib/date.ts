const months = [
  "yanvar",
  "fevral",
  "mart",
  "aprel",
  "may",
  "iyun",
  "iyul",
  "avgust",
  "sentabr",
  "oktabr",
  "noyabr",
  "dekabr",
];
export function uzDate(
  value: Date | string,
  full = false,
  timeZone = "Asia/Tashkent",
) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-GB", {
      day: "numeric",
      month: "numeric",
      year: "numeric",
      timeZone,
    })
      .formatToParts(new Date(value))
      .map((p) => [p.type, p.value]),
  );
  return `${Number(parts.day)} ${months[Number(parts.month) - 1]}${full ? ` ${parts.year}` : ""}`;
}
export function uzWeekday(value: Date, timeZone = "Asia/Tashkent") {
  const index = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(
    new Intl.DateTimeFormat("en-US", { weekday: "short", timeZone }).format(
      value,
    ),
  );
  return ["Yak", "Du", "Se", "Chor", "Pay", "Ju", "Sha"][index];
}
