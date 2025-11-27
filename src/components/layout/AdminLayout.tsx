import { ReactNode } from "react";
import { AdminSidebar } from "./AdminSidebar";
import { AppHeader } from "./AppHeader";

interface AdminLayoutProps {
  children: ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <AdminSidebar />
      <div className="lg:pl-[280px] min-h-screen flex flex-col">
        <AppHeader />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
