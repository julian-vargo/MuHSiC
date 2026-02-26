import React from "react";
import { MapContainer, TileLayer, CircleMarker } from "react-leaflet";
import "leaflet/dist/leaflet.css";

type Point = { latitude: number; longitude: number };

export default function LocationsMap({ points }: { points: Point[] }) {
// Fallback center (California-ish) if no data
const center: [number, number] =
points.length > 0 ? [points[0].latitude, points[0].longitude] : [37.0, -120.0];

return (
<div style={{ height: "520px", width: "100%" }}>
<MapContainer center={center} zoom={6} style={{ height: "100%", width: "100%" }}>
<TileLayer
attribution='&copy; OpenStreetMap contributors'
url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
/>
{points.map((p, i) => (
<CircleMarker
key={i}
center={[p.latitude, p.longitude]}
radius={5}
pathOptions={{}}
/>
))}
</MapContainer>
</div>
);
}
