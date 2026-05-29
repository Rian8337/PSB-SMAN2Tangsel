"use client";

import { Button } from "@chakra-ui/react";
import { Trash2 } from "lucide-react";

interface Props {
    ariaLabel: string;
    onClick: () => void;
}

export function TableDeleteButton({ ariaLabel, onClick }: Props) {
    return (
        <Button
            size="sm"
            variant="ghost"
            colorPalette="red"
            aria-label={ariaLabel}
            onClick={onClick}
        >
            <Trash2 size={16} />
        </Button>
    );
}
