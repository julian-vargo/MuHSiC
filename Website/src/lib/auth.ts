// the one that can fully read the corpus is the one with a role that is not "guest"
export const canRead = (session) =>
  (session?.user?.role || "guest") !== "guest";
