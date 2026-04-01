import { useState, useEffect } from "react";
import { RouterProvider } from "react-router";
import { LoadingScreen } from "./components/LoadingScreen";
import { router } from "./routes.tsx";

export default function App() {
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const prefersReducedMotion =
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const seenLoader = window.sessionStorage.getItem("frigate-loader-seen") === "1";

    if (seenLoader) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const timer = window.setTimeout(() => {
      window.sessionStorage.setItem("frigate-loader-seen", "1");
      setLoading(false);
    }, prefersReducedMotion ? 120 : 520);

    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <LoadingScreen visible={loading} />
      <div>
        <RouterProvider router={router} />
      </div>
    </>
  );
}
