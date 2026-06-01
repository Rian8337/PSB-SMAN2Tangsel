import { AdminDashboardShell } from "@/components/layout/AdminDashboardShell";
import { AdminSessionProvider } from "@/providers/AdminSessionContext";
import { PropsWithChildren } from "react";

export default function AdminLayout({ children }: PropsWithChildren) {
    return (
        <AdminSessionProvider>
            <AdminDashboardShell>{children}</AdminDashboardShell>
        </AdminSessionProvider>
    );
}
