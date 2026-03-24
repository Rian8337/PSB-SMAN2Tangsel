import { AdminDashboardShell } from "@/components/layout/AdminDashboardShell";
import { PropsWithChildren } from "react";

export default function AdminLayout({ children }: PropsWithChildren) {
    return <AdminDashboardShell>{children}</AdminDashboardShell>;
}
