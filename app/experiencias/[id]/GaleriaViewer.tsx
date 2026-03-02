"use client";

import { useState } from "react";

type Props = {
    images: string[];
    title: string;
};

export default function GaleriaViewer({ images, title }: Props) {
    const [active, setActive] = useState(0);
    const [lightbox, setLightbox] = useState(false);

    if (images.length === 0) return null;

    return (
        <>
            {/* Galería principal */}
            <div style={{ marginBottom: 32 }}>
                {/* Imagen principal */}
                <div
                    onClick={() => setLightbox(true)}
                    style={{ position: "relative", height: 380, borderRadius: 20, overflow: "hidden", cursor: "zoom-in", marginBottom: 10 }}
                >
                    <img
                        src={images[active]}
                        alt={title}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                    {images.length > 1 && (
                        <div style={{ position: "absolute", bottom: 12, right: 14, backgroundColor: "rgba(0,0,0,0.45)", color: "#fff", fontSize: 12, fontWeight: 700, padding: "4px 10px", borderRadius: 999 }}>
                            {active + 1} / {images.length}
                        </div>
                    )}
                    <div style={{ position: "absolute", bottom: 12, left: 14, backgroundColor: "rgba(0,0,0,0.35)", color: "#fff", fontSize: 11, padding: "4px 10px", borderRadius: 999 }}>
                        🔍 Ver en grande
                    </div>
                </div>

                {/* Thumbnails */}
                {images.length > 1 && (
                    <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4 }}>
                        {images.map((img, i) => (
                            <div
                                key={i}
                                onClick={() => setActive(i)}
                                style={{
                                    width: 80, height: 60, borderRadius: 10, overflow: "hidden",
                                    flexShrink: 0, cursor: "pointer",
                                    border: i === active ? "3px solid #4E6B3A" : "3px solid transparent",
                                    opacity: i === active ? 1 : 0.7,
                                    transition: "all 0.15s"
                                }}
                            >
                                <img src={img} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Lightbox */}
            {lightbox && (
                <div
                    onClick={() => setLightbox(false)}
                    style={{
                        position: "fixed", inset: 0, zIndex: 1000,
                        backgroundColor: "rgba(0,0,0,0.92)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        padding: 20
                    }}
                >
                    {/* Botón cerrar */}
                    <button
                        onClick={() => setLightbox(false)}
                        style={{ position: "absolute", top: 20, right: 24, background: "rgba(255,255,255,0.15)", border: "none", color: "#fff", fontSize: 22, width: 40, height: 40, borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                    >
                        ×
                    </button>

                    {/* Imagen */}
                    <img
                        src={images[active]}
                        alt={title}
                        onClick={(e) => e.stopPropagation()}
                        style={{ maxWidth: "90vw", maxHeight: "85vh", objectFit: "contain", borderRadius: 12 }}
                    />

                    {/* Navegación */}
                    {images.length > 1 && (
                        <>
                            <button
                                onClick={(e) => { e.stopPropagation(); setActive((active - 1 + images.length) % images.length); }}
                                style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", background: "rgba(255,255,255,0.15)", border: "none", color: "#fff", fontSize: 22, width: 44, height: 44, borderRadius: "50%", cursor: "pointer" }}
                            >
                                ‹
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); setActive((active + 1) % images.length); }}
                                style={{ position: "absolute", right: 16, top: "50%", transform: "translateY(-50%)", background: "rgba(255,255,255,0.15)", border: "none", color: "#fff", fontSize: 22, width: 44, height: 44, borderRadius: "50%", cursor: "pointer" }}
                            >
                                ›
                            </button>
                            <div style={{ position: "absolute", bottom: 20, left: "50%", transform: "translateX(-50%)", color: "rgba(255,255,255,0.7)", fontSize: 13 }}>
                                {active + 1} / {images.length}
                            </div>
                        </>
                    )}
                </div>
            )}
        </>
    );
}