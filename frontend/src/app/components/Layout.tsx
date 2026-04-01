import { Outlet, useLocation } from "react-router";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";

export function Layout() {
  const location = useLocation();
  const isFocusedPage = ["/composer", "/what-if", "/dashboard", "/profile", "/login", "/signup"].includes(location.pathname);

  return (
    <div className="w-full" style={{ fontFamily: "Inter, sans-serif" }}>
      <Navbar />
      <main>
        <Outlet />
      </main>
      {!isFocusedPage && <Footer />}
    </div>
  );
}
