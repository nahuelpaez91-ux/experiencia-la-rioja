"use client";

import { useState, useRef, useEffect } from "react";
import { localidades } from "@/app/lib/localidades-larioja";

const GREEN = "#4E6B3A";
const BORDER = "#e7e2da";

export default function LocationSearch({ defaultValue }: { defaultValue?: string }) {
    const [input, setInput] = useState(defaultValue ?? "");
    const [selected, setSelected] = useState(defaultValue ?? "");
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [open, setOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const handleInput = (val: string) => {
        setInput(val);
        setSelected("");
        if (!val.trim()) {
            setSuggestions([]);
            setOpen(false);
            return;
        }
        const q = val.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        const matches = localidades.filter((l) => {
            const norm = l.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            return norm.includes(q);
        });
        setSuggestions(matches);
        setOpen(true);
    };

    const handleSelect = (loc: string) => {
        setInput(loc);
        setSelected(loc);
        setSuggestions([]);
        setOpen(false);
    };

    const handleClear = () => {
        setInput("");
        setSelected("");
        setSuggestions([]);
        setOpen(false);
    };

    return (
        <div ref={containerRef} style={{ position: "relative" }}>
            <label style={{
                fontSize: 11, fontWeight: 700, color: "#888",
                textTransform: "uppercase", letterSpacing: "0.05em",
                display: "block", marginBottom: 6,
            }}>
                Localidad
            </label>

            <input type="hidden" name="location" value={selected || input} />

            <div style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "10px 14px", borderRadius: 12,
                border: `1.5px solid ${selected ? GREEN : BORDER}`,
                backgroundColor: "#fafafa",
                transition: "border-color 0.15s",
            }}>
                <span style={{ fontSize: 14, flexShrink: 0 }}>📍</span>
                <input
                    type="text"
                    value={input}
                    onChange={(e) => handleInput(e.target.value)}
                    onFocus={() => { if (suggestions.length > 0) setOpen(true); }}
                    placeholder="Ej: Chilecito, Anillaco..."
                    autoComplete="off"
                    style={{
                        flex: 1, background: "none", border: "none", outline: "none",
                        fontSize: 13, color: "#333", minWidth: 0,
                    }}
                />
                {input && (
                    <button type="button" onClick={handleClear} style={{
                        background: "none", border: "none", cursor: "pointer",
                        color: "#bbb", fontSize: 18, padding: 0, lineHeight: 1, flexShrink: 0,
                    }}>×</button>
                )}
            </div>

            {open && (
                <DropdownPortal
                    containerRef={containerRef}
                    onClose={() => setOpen(false)}
                >
                    {suggestions.length > 0 ? (
                        suggestions.map((loc) => (
                            <button
                                key={loc}
                                type="button"
                                onClick={() => handleSelect(loc)}
                                style={{
                                    display: "block", width: "100%", textAlign: "left",
                                    padding: "10px 14px", background: "none", border: "none",
                                    borderBottom: `1px solid ${BORDER}`, cursor: "pointer",
                                    fontSize: 13, color: "#333",
                                }}
                                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f5f0ea")}
                                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                            >
                                📍 {loc}
                            </button>
                        ))
                    ) : (
                        <div style={{ padding: "12px 14px", fontSize: 13, color: "#888" }}>
                            No encontramos "{input}" en La Rioja
                        </div>
                    )}
                </DropdownPortal>
            )}
        </div>
    );
}

function DropdownPortal({ containerRef, children, onClose }: {
    containerRef: React.RefObject<HTMLDivElement | null>;
    children: React.ReactNode;
    onClose: () => void;
}) {
    const [style, setStyle] = useState<React.CSSProperties>({});

    useEffect(() => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        setStyle({
            position: "fixed",
            top: rect.bottom + 6,
            left: rect.left,
            width: rect.width,
            backgroundColor: "#fff",
            border: `1px solid ${BORDER}`,
            borderRadius: 14,
            boxShadow: "0 8px 32px rgba(0,0,0,0.14)",
            zIndex: 99999,
            maxHeight: 240,
            overflowY: "auto",
        });
    }, [containerRef]);

    return <div style={style}>{children}</div>;
}