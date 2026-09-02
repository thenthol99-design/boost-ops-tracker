import { useState, useCallback } from "react";

export function useToast() {
  const [toast, setToast] = useState(null);
  const show = useCallback((msg, type) => {
    const resolvedType = type ||
      (msg.includes("Error") || msg.includes("error") || msg.includes("failed") || msg.includes("Failed")
        ? "error"
        : msg.startsWith("Success") || msg.startsWith("Saved") || msg.startsWith("Added") || msg.startsWith("Created")
          ? "success"
          : "info");
    setToast({ msg, type: resolvedType });
    clearTimeout(show._t);
    show._t = setTimeout(() => setToast(null), 3000);
  }, []);
  return [toast, show];
}
