import { useEffect } from "react";

export function usePageMeta(title, description) {
  useEffect(() => {
    const prevTitle = document.title;
    document.title = title ? `${title} — Lekki Tides` : "Lekki Tides";

    let meta = document.querySelector('meta[name="description"]');
    let prevDescription = meta?.getAttribute("content");
    if (description && meta) {
      meta.setAttribute("content", description);
    }

    return () => {
      document.title = prevTitle;
      if (meta && prevDescription) meta.setAttribute("content", prevDescription);
    };
  }, [title, description]);
}
