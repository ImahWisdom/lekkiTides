import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

// Shown when a property has photos. Falls back to nothing if `images` is
// empty — the caller decides what placeholder to show instead (icon panel,
// etc.) in that case.
export default function PhotoGallery({ images, alt, className = "" }) {
  const [index, setIndex] = useState(0);

  if (!images?.length) return null;

  const safeIndex = Math.min(index, images.length - 1);

  function prev() {
    setIndex((i) => (i - 1 + images.length) % images.length);
  }
  function next() {
    setIndex((i) => (i + 1) % images.length);
  }

  return (
    <div className={className}>
      <div className="relative rounded-xl overflow-hidden border border-[#E3DBC9] bg-[#EFE9DA]">
        <img
          src={images[safeIndex]}
          alt={`${alt} — photo ${safeIndex + 1} of ${images.length}`}
          className="w-full aspect-[16/10] object-cover"
        />
        {images.length > 1 && (
          <>
            <button
              onClick={prev}
              aria-label="Previous photo"
              className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={next}
              aria-label="Next photo"
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70"
            >
              <ChevronRight size={18} />
            </button>
            <div className="absolute bottom-2 right-2 rounded-full bg-black/60 text-white text-[11px] px-2 py-0.5" style={{ fontFamily: "IBM Plex Mono, monospace" }}>
              {safeIndex + 1} / {images.length}
            </div>
          </>
        )}
      </div>

      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1 mt-2 -mx-1 px-1">
          {images.map((url, i) => (
            <button
              key={url}
              onClick={() => setIndex(i)}
              aria-label={`View photo ${i + 1}`}
              className={
                "flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors " +
                (i === safeIndex ? "border-[#0B3D3C]" : "border-transparent opacity-70 hover:opacity-100")
              }
            >
              <img src={url} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
