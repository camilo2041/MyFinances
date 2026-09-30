"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import Landing from "@/components/Landing";
import Sidebar from "@/components/Sidebar";

// Páginas de acceso: sin sesión se muestran; con sesión redirigen al panel.
const AUTH_PAGES = ["/login", "/registro"];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const onAuthPage = AUTH_PAGES.includes(pathname);
  const onHome = pathname === "/";

  useEffect(() => {
    if (loading) return;
    // "/" sin sesión es la página pública; el resto exige sesión.
    if (!user && !onAuthPage && !onHome) router.replace("/login");
    if (user && onAuthPage) router.replace("/");
  }, [user, loading, onAuthPage, onHome, router]);

  if (loading) {
    return (
      <div className={`flex min-h-screen items-center justify-center ${onHome ? "bg-[#0e0c1c]" : "bg-paper"}`}>
        <span className="spinner" style={{ width: 22, height: 22 }} />
      </div>
    );
  }

  if (onAuthPage) {
    return user ? null : <>{children}</>;
  }

  if (!user) return onHome ? <Landing /> : null;

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">{children}</div>
    </div>
  );
}
