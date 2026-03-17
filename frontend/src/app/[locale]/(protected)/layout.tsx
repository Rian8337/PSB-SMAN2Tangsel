import { DashboardShell } from "@/components/layout/DashboardShell";
import { PropsWithChildren } from "react";

export default function ProtectedLayout(props: PropsWithChildren) {
    return <DashboardShell>{props.children}</DashboardShell>;
}
