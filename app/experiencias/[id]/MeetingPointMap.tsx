"use client";

import { useEffect, useRef } from "react";

const GREEN = "#4E6B3A";

export default function MeetingPointMap({ lat, lng, label }: { lat: number; lng: number; label: string }) {
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<any>(null);

    useEffect(() => {
        if (!mapRef.current || mapInstanceRef.current) return;

        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
        document.head.appendChild(link);

        const script = document.createElement("script");
        script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
        script.onload = () => {
            const L = (window as any).L;
            const map = L.map(mapRef.current, { zoomControl: true, scrollWheelZoom: false }).setView([lat, lng], 15);

            L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
                attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            }).addTo(map);

            const icon = L.divIcon({
                html: `
                    <div style="
                        background:${GREEN};
                        width:26px;height:26px;
                        border-radius:50% 50% 50% 0;
                        transform:rotate(-45deg);
                        border:3px solid #fff;
                        box-shadow:0 3px 10px rgba(0,0,0,0.3)
                    "></div>`,
                iconSize: [26, 26],
                iconAnchor: [13, 26],
                className: ""
            });

            const marker = L.marker([lat, lng], { icon }).addTo(map);
            marker.bindPopup(`<strong style="font-size:13px">${label}</strong>`).openPopup();

            mapInstanceRef.current = map;
        };
        document.head.appendChild(script);

        return () => {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
            }
        };
    }, []);

    return (
        <div style={{ borderRadius: 18, overflow: "hidden", border: "1px solid #e7e2da", boxShadow: "0 2px 12px rgba(0,0,0,0.07)" }}>
            <div ref={mapRef} style={{ width: "100%", height: 280 }} />
            <div style={{ backgroundColor: "#fff", padding: "10px 16px", display: "flex", alignItems: "center", gap: 8, borderTop: "1px solid #e7e2da" }}>
                <span style={{ fontSize: 16 }}>📍</span>
                <span style={{ fontSize: 13, color: "#555", flex: 1 }}>{label}</span>
                <a
                    href={`https://www.google.com/maps?q=${lat},${lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ fontSize: 12, fontWeight: 700, color: GREEN, textDecoration: "none", whiteSpace: "nowrap" }}
                >
                    Ver en Google Maps →
                </a>
            </div>
        </div>
    );
}