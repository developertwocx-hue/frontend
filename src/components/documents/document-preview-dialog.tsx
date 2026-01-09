
"use client";

import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, ExternalLink, FileText, X } from "lucide-react";
import Image from "next/image";

interface DocumentPreviewDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    document: {
        id: number | string;
        name: string;
        url: string;
        type: string; // 'application/pdf', 'image/jpeg', etc.
        uploaded_at?: string;
    } | null;
}

export function DocumentPreviewDialog({
    open,
    onOpenChange,
    document,
}: DocumentPreviewDialogProps) {
    if (!document) return null;

    const isPdf = document.type === "application/pdf" || document.url.endsWith(".pdf");
    const isImage = document.type.startsWith("image/") || /\.(jpg|jpeg|png|webp)$/i.test(document.url);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0 gap-0">
                <DialogHeader className="px-6 py-4 border-b flex-shrink-0 flex flex-row items-center justify-between">
                    <div>
                        <DialogTitle>{document.name}</DialogTitle>
                        <DialogDescription>
                            {document.uploaded_at ? new Date(document.uploaded_at).toLocaleString() : "Document Preview"}
                        </DialogDescription>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" asChild>
                            <a href={document.url} target="_blank" rel="noreferrer" title="Open in new tab">
                                <ExternalLink className="h-4 w-4" />
                            </a>
                        </Button>
                        <Button variant="ghost" size="icon" asChild>
                            <a href={document.url} download title="Download">
                                <Download className="h-4 w-4" />
                            </a>
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)}>
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                </DialogHeader>

                <div className="flex-1 bg-muted/30 overflow-hidden flex items-center justify-center relative p-4">
                    {isImage ? (
                        <div className="relative w-full h-full min-h-[400px]">
                            <Image
                                src={document.url}
                                alt={document.name}
                                fill
                                className="object-contain"
                                unoptimized
                            />
                        </div>
                    ) : isPdf ? (
                        <iframe
                            src={`${document.url}#toolbar=0`}
                            className="w-full h-full rounded border bg-white"
                            title={document.name}
                        />
                    ) : (
                        <div className="text-center py-20">
                            <FileText className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                            <h3 className="text-lg font-medium">Preview not available</h3>
                            <p className="text-muted-foreground mb-4">
                                This file type cannot be previewed directly.
                            </p>
                            <Button asChild>
                                <a href={document.url} download>
                                    Download File
                                </a>
                            </Button>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
