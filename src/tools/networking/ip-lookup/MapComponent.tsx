"use client";

import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";

export default function MapComponent({ lat, lon }: { lat: number; lon: number }) {
    const [isLoading, setIsLoading] = useState(true);
    
    // In order to not spam the map server if lat/lon change rapidly, 
    // we can use the props directly since they are updated cleanly by the parent.
    const mapUrl = `https://maps.google.com/maps?q=${lat},${lon}&z=12&output=embed`;

    // Reset loading state if coordinates change
    useEffect(() => {
        setIsLoading(true);
    }, [lat, lon]);

    return (
        <div className="relative w-full h-full rounded-2xl overflow-hidden bg-zinc-100 dark:bg-zinc-900/50">
            {isLoading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-zinc-100 dark:bg-zinc-900 text-zinc-500">
                    <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
                    <span className="mt-3 text-sm font-medium">Loading Map...</span>
                </div>
            )}
            <iframe 
                src={mapUrl}
                className={`w-full h-full border-0 transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                onLoad={() => setIsLoading(false)}
                title="IP Location Map"
            />
        </div>
    );
}
