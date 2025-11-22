export const nocodbHost = import.meta.env.NOCODB_URL;
export const token = import.meta.env.NOCODB_TOKEN;
export const tableId = import.meta.env.NOCODB_TABLEID;

const arrayToQuery = (key: string, vals?: string[]) =>
  vals !== undefined && vals.length > 0 ? `${key}=${vals.join(",")}` : "";

export const read = async ({
  id,
  fields,
  view,
  table,
}: {
  id?: string;
  fields?: string[];
  view?: string;
  table?: string;
}): Promise<any[]> => {
  const res = await fetch(
    `${nocodbHost}/api/v2/tables/${table || tableId}/records?${id !== undefined ? `where=%28participant_code%2Ceq%2C${id}%29&` : ""}limit=999&${arrayToQuery("fields", fields)}${view ? `&viewId=${view}` : ""}`,
    {
      headers: {
        accept: "application/json",
        "xc-token": token,
      },
    },
  );
  if (!res.ok) return Promise.reject(res.statusText);
  return (await res.json()).list;
};
