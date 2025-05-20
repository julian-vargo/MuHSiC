export const stringToGeo = (str) => {
  const arr = str.split(";");
  return {
    lat: Number(arr[0]),
    lon: Number(arr[1]),
  };
};
export const geoToString = (geo) => {
  return `${geo.lat.toString()};${geo.lon.toString()}`;
};
