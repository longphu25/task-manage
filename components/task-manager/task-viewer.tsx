"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogTitle,
    DialogDescription,
    DialogClose,
} from "@/components/ui/dialog";
import { useState } from "react";
import { formatDueDate, getPriorityLabel, isOverdue } from "@/helpers";
import { useSuiClientQuery } from "@mysten/dapp-kit";
import { Hash, Copy, ExternalLink } from "lucide-react";

interface TaskViewerProps {
    taskId: string;
}

export function TaskViewer({ taskId }: TaskViewerProps) {
    const [decryptedContent, setDecryptedContent] = useState<string>("");
    const [decryptedFiles, setDecryptedFiles] = useState<
        Array<{ name: string; url: string; type: string }>
    >([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    // Fetch task from blockchain
    const { data: taskData, isLoading: isLoadingTask, isError } = useSuiClientQuery(
        "getObject",
        {
            id: taskId,
            options: {
                showContent: true,
                showOwner: true,
            },
        },
        {
            enabled: !!taskId,
        }
    );

    if (isLoadingTask) {
        return (
            <Card className="p-4">
                <CardContent className="flex items-center justify-center p-8">
                    <p className="text-muted-foreground">Loading task details...</p>
                </CardContent>
            </Card>
        );
    }

    if (isError || !taskData?.data?.content) {
        return (
            <Card className="p-4">
                <CardContent className="flex items-center justify-center p-8">
                    <p className="text-red-500">Failed to load task details</p>
                </CardContent>
            </Card>
        );
    }

    if (taskData.data.content.dataType !== "moveObject") {
        return (
            <Card className="p-4">
                <CardContent className="flex items-center justify-center p-8">
                    <p className="text-red-500">Invalid task data</p>
                </CardContent>
            </Card>
        );
    }

    const fields = taskData.data.content.fields as Record<string, unknown>;
    const dueDate = fields.due_date as { vec: string[] } | undefined;
    const contentBlobId = fields.content_blob_id as { vec: string[] } | undefined;
    const fileBlobIds = (fields.file_blob_ids as string[]) || [];
    const status = fields.status as number;
    const createdAt = fields.created_at as string;
    const updatedAt = fields.updated_at as string;
    const category = fields.category as string;
    const tags = (fields.tags as string[]) || [];

    const task = {
        id: taskData.data.objectId,
        title: String(fields.title || ""),
        description: String(fields.description || ""),
        creator: String(fields.creator || ""),
        priority: Number(fields.priority || 1),
        status,
        is_completed: status === 2, // STATUS_COMPLETED = 2
        created_at: createdAt,
        updated_at: updatedAt,
        due_date: dueDate?.vec?.[0] || "0",
        content_blob_id: contentBlobId?.vec?.[0] || "",
        file_blob_ids: fileBlobIds,
        category,
        tags,
    };

    const priorityInfo = getPriorityLabel(task.priority);
    const overdueStatus = isOverdue(task.due_date, task.is_completed);

    const copyToClipboard = async (text: string) => {
        try {
            await navigator.clipboard.writeText(text);
            alert("Copied to clipboard!");
        } catch (err) {
            console.error("Failed to copy:", err);
        }
    };

    const getStatusLabel = (status: number) => {
        switch (status) {
            case 0: return { label: "To Do", color: "bg-gray-500" };
            case 1: return { label: "In Progress", color: "bg-blue-500" };
            case 2: return { label: "Completed", color: "bg-green-500" };
            case 3: return { label: "Archived", color: "bg-orange-500" };
            default: return { label: "Unknown", color: "bg-gray-500" };
        }
    };

    const statusInfo = getStatusLabel(task.status);

    return (
        <Card
            className={`p-4 ${
                overdueStatus ? "border-2 border-red-500 bg-red-50" : ""
            }`}
        >
            <CardContent className="flex flex-col gap-4 p-0">
                {/* --- Task Info --- */}
                <div className="flex flex-col gap-3">
                    {/* Title and Priority */}
                    <div className="flex items-start gap-2 flex-wrap">
                        <strong className="text-lg font-semibold flex-1">
                            {task.title}
                        </strong>

                        <Badge
                            className={`${priorityInfo.color} text-white`}
                        >
                            {priorityInfo.label}
                        </Badge>

                        <Badge className={`${statusInfo.color} text-white`}>
                            {statusInfo.label}
                        </Badge>

                        {overdueStatus && (
                            <Badge className="bg-red-600 text-white">
                                OVERDUE
                            </Badge>
                        )}
                    </div>

                    {/* Description */}
                    <p className="text-sm text-muted-foreground">
                        {task.description}
                    </p>

                    {/* Object ID Section - Enhanced */}
                    <div className="border rounded-lg p-3 bg-gradient-to-r from-slate-50 to-blue-50 dark:from-slate-900 dark:to-blue-900">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <Hash className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                                    Object ID
                                </span>
                            </div>
                            <div className="flex gap-1">
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => copyToClipboard(task.id)}
                                    className="h-7 px-2 text-xs"
                                    title="Copy Object ID"
                                >
                                    <Copy className="h-3 w-3 mr-1" />
                                    Copy
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    asChild
                                    className="h-7 px-2 text-xs"
                                    title="View on Suiscan"
                                >
                                    <a
                                        href={`https://suiscan.xyz/testnet/object/${task.id}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        <ExternalLink className="h-3 w-3 mr-1" />
                                        View
                                    </a>
                                </Button>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 p-2 bg-white dark:bg-slate-800 rounded border border-gray-200 dark:border-gray-700">
                            <code className="text-xs font-mono flex-1 break-all text-gray-800 dark:text-gray-200">
                                {task.id}
                            </code>
                        </div>
                    </div>

                    {/* Creator Section - Enhanced */}
                    <div className="border rounded-lg p-3 bg-slate-50 dark:bg-slate-900">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 shrink-0">
                                    Created by:
                                </span>
                                <code className="text-sm font-mono text-blue-600 dark:text-blue-400 truncate">
                                    {task.creator}
                                </code>
                            </div>
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => copyToClipboard(task.creator)}
                                className="h-7 px-2 shrink-0"
                                title="Copy creator address"
                            >
                                <Copy className="h-3 w-3" />
                            </Button>
                        </div>
                    </div>

                    {/* Dates */}
                    <div className="border rounded-lg p-3 bg-slate-50 dark:bg-slate-900">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div>
                                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide block mb-1">
                                    Created
                                </span>
                                <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                                    {new Date(parseInt(task.created_at)).toLocaleString()}
                                </p>
                            </div>
                            <div>
                                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide block mb-1">
                                    Updated
                                </span>
                                <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                                    {new Date(parseInt(task.updated_at)).toLocaleString()}
                                </p>
                            </div>
                            <div>
                                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide block mb-1">
                                    Due Date
                                </span>
                                <p className={`text-sm font-medium ${overdueStatus ? 'text-red-600 font-bold' : 'text-gray-800 dark:text-gray-200'}`}>
                                    {formatDueDate(task.due_date)}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Category and Tags */}
                    {(task.category || (task.tags && task.tags.length > 0)) && (
                        <div className="border rounded-lg p-3 bg-slate-50 dark:bg-slate-900">
                            {task.category && (
                                <div className="mb-3">
                                    <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide block mb-2">
                                        Category
                                    </span>
                                    <Badge variant="outline" className="text-sm">
                                        {task.category}
                                    </Badge>
                                </div>
                            )}

                            {task.tags && task.tags.length > 0 && (
                                <div>
                                    <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide block mb-2">
                                        Tags
                                    </span>
                                    <div className="flex flex-wrap gap-1.5">
                                        {task.tags.map((tag, index) => (
                                            <Badge 
                                                key={index} 
                                                variant="secondary" 
                                                className="text-xs px-2 py-0.5"
                                            >
                                                #{tag}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Content and Files Info */}
                    {(task.content_blob_id || task.file_blob_ids.length > 0) && (
                        <div className="border rounded-lg p-3 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-xs font-semibold text-blue-700 dark:text-blue-300 uppercase tracking-wide">
                                    Encrypted Content
                                </span>
                            </div>
                            <div className="flex flex-col gap-1.5 text-sm">
                                {task.content_blob_id && (
                                    <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                                        <span className="text-lg">📄</span>
                                        <span>Text content available</span>
                                    </div>
                                )}
                                {task.file_blob_ids.length > 0 && (
                                    <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                                        <span className="text-lg">📎</span>
                                        <span>{task.file_blob_ids.length} file(s) attached</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* --- Decrypt Button --- */}
                <Button
                    disabled={
                        isLoading ||
                        (!task.content_blob_id &&
                            task.file_blob_ids.length === 0)
                    }
                >
                    {isLoading
                        ? "Decrypting content..."
                        : "View Content & Download Files"}
                </Button>

                {/* --- Error Box --- */}
                {error && (
                    <div className="p-3 bg-red-100 rounded-md">
                        <p className="text-sm text-red-600 whitespace-pre-line">
                            {error}
                        </p>
                    </div>
                )}

                {/* --- Dialog --- */}
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogContent className="max-w-3xl">
                        <DialogTitle>Decrypted Task Content</DialogTitle>
                        <DialogDescription>
                            {decryptedContent || decryptedFiles.length > 0 ? (
                                <div className="flex flex-col gap-4">
                                    {/* --- Decrypted Text --- */}
                                    {decryptedContent && (
                                        <div>
                                            <strong>Content:</strong>
                                            <div className="p-3 bg-gray-50 rounded-md mt-2">
                                                <p className="whitespace-pre-wrap">
                                                    {decryptedContent}
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {/* --- Decrypted Files --- */}
                                    {decryptedFiles.length > 0 && (
                                        <div>
                                            <strong>
                                                Files ({decryptedFiles.length}):
                                            </strong>
                                            <div className="flex flex-col gap-2 mt-2">
                                                {decryptedFiles.map(
                                                    (file, index) => (
                                                        <div
                                                            key={index}
                                                            className="flex justify-between items-center p-2 bg-gray-50 rounded-md"
                                                        >
                                                            <p>{file.name}</p>
                                                            <div className="flex gap-2">
                                                                {file.type.startsWith(
                                                                    "image/"
                                                                ) && (
                                                                    <Button
                                                                        variant="secondary"
                                                                        size="sm"
                                                                        onClick={() =>
                                                                            window.open(
                                                                                file.url,
                                                                                "_blank"
                                                                            )
                                                                        }
                                                                    >
                                                                        View
                                                                    </Button>
                                                                )}
                                                                <Button
                                                                    size="sm"
                                                                    asChild
                                                                >
                                                                    <a
                                                                        href={
                                                                            file.url
                                                                        }
                                                                        download={
                                                                            file.name
                                                                        }
                                                                    >
                                                                        Download
                                                                    </a>
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    )
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <p>No content found to decrypt.</p>
                            )}
                        </DialogDescription>

                        <div className="flex justify-end gap-3 mt-4">
                            <DialogClose asChild>
                                <Button variant="secondary">Close</Button>
                            </DialogClose>
                        </div>
                    </DialogContent>
                </Dialog>
            </CardContent>
        </Card>
    );
}
