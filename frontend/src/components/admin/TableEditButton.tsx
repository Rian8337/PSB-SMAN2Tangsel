"use client";

import { Link } from "@/i18n/navigation";
import { Button } from "@chakra-ui/react";
import { Pencil } from "lucide-react";

interface Props {
    href: string;
    ariaLabel: string;
}

export function TableEditButton({ href, ariaLabel }: Props) {
    return (
        <Button
            asChild
            size="sm"
            variant="ghost"
            colorPalette="blue"
            aria-label={ariaLabel}
        >
            <Link href={href}>
                <Pencil size={16} />
            </Link>
        </Button>
    );
}
