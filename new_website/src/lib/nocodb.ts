export const nocodbHost = import.meta.env.NOCODB_URL;
const token = import.meta.env.NOCODB_TOKEN;
const tableId = import.meta.env.NOCODB_TABLEID;

const arrayToQuery = (key: string, vals?: string[]) =>
  vals !== undefined && vals.length > 0 ? `${key}=${vals.join(",")}` : "";

export const read = async ({
  id,
  fields,
  view,
}: {
  id?: string;
  fields?: string[];
  view?: string;
}): Promise<any[]> => {
  const res = await fetch(
    `${nocodbHost}/api/v2/tables/${tableId}/records?${id !== undefined ? `where=%28participant_code%2Ceq%2C${id}%29&` : ""}limit=999&${arrayToQuery("fields", fields)}${view ? `&viewId=${view}` : ""}`,
    {
      headers: {
        accept: "application/json",
        "xc-token": token,
      },
    },
  );
  if (!res.ok) return Promise.reject(res.statusText);
  const list = (await res.json()).list.map((i) => {
    delete i.Id;
    return i;
  });
  return list;
};

// const res = await read({ id: "1" })
// const res = await read({ fields: ["participant_code", "sex", "speaker_group", "language_dominance"] })
// console.log(res)
