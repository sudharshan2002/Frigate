import { useState, useEffect } from "react";
import { RouterProvider } from "react-router";
import { LoadingScreen } from "./components/LoadingScreen";
import { router } from "./routes.tsx";

export default function App() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const prefersReducedMotion =
      typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timer = setTimeout(() => setLoading(false), prefersReducedMotion ? 180 : 900);
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
