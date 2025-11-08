"use client";

import { useState } from "react";
import { useSignAndExecuteTransaction, useSuiClient, useCurrentAccount } from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import { Label } from "../ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "../ui/select";
import { Textarea } from "../ui/textarea";
import { Loader2 } from "lucide-react";

const walrusServices = [
    {
        id: "service1",
        name: "walrus.space",
        publisherUrl: "https://publisher.walrus-testnet.walrus.space",
        aggregatorUrl: "https://aggregator.walrus-testnet.walrus.space",
    },
    {
        id: "service2",
        name: "staketab.org",
        publisherUrl: "https://walrus-testnet-publisher.staketab.org",
        aggregatorUrl: "https://wal-aggregator-testnet.staketab.org",
    },
    {
        id: "service3",
        name: "nodes.guru",
        publisherUrl: "https://walrus-testnet-publisher.nodes.guru",
        aggregatorUrl: "https://walrus-testnet-aggregator.nodes.guru",
    },
    {
        id: "service4",
        name: "blockscope.net",
        publisherUrl: "https://walrus-testnet-publisher.blockscope.net",
        aggregatorUrl: "https://walrus-testnet.blockscope.net",
    },
    {
        id: "service5",
        name: "overclock.run",
        publisherUrl: "https://walrus-testnet-publisher.overclock.run",
        aggregatorUrl: "https://sui-walrus-testnet.overclock.run",
    },
];

interface TaskContentUploadProps {
    taskId?: string;
}

export const TaskContentUpload = ({ taskId }: TaskContentUploadProps) => {
    const [content, setContent] = useState("");
    const [files, setFiles] = useState<FileList | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [selectedService, setSelectedService] = useState("service1");

    const account = useCurrentAccount();
    const suiClient = useSuiClient();
    const queryClient = useQueryClient();
    const { mutateAsync: signAndExecuteTransaction } = useSignAndExecuteTransaction();

    const handleUpload = async () => {
        if (!taskId || !account) {
            toast.error("Task ID or account not available");
            return;
        }

        const packageId = process.env.NEXT_PUBLIC_PACKAGE_ID;
        const versionObjectId = process.env.NEXT_PUBLIC_VERSION_ID;

        if (!packageId || !versionObjectId) {
            toast.error("Configuration error: Missing package or version ID");
            return;
        }

        const service = walrusServices.find(s => s.id === selectedService);
        if (!service) {
            toast.error("Please select a valid Walrus service");
            return;
        }

        setIsUploading(true);

        try {
            const tx = new Transaction();
            let contentBlobId: string | null = null;
            const fileBlobIds: string[] = [];

            // Upload content to Walrus if provided
            if (content.trim()) {
                try {
                    const contentBlob = new Blob([content], { type: 'text/plain' });
                    const formData = new FormData();
                    formData.append('file', contentBlob, 'content.txt');

                    const response = await fetch(`${service.publisherUrl}/v1/store`, {
                        method: 'PUT',
                        body: formData,
                    });

                    if (!response.ok) {
                        throw new Error(`Walrus upload failed: ${response.statusText}`);
                    }

                    const result = await response.json();
                    contentBlobId = result.newlyCreated?.blobObject?.blobId || 
                                   result.alreadyCertified?.blobId;
                    
                    if (!contentBlobId) {
                        throw new Error("Failed to get blob ID from Walrus response");
                    }

                    toast.success("Content uploaded to Walrus");
                } catch (error) {
                    console.error("Error uploading content:", error);
                    toast.error("Failed to upload content to Walrus");
                    setIsUploading(false);
                    return;
                }
            }

            // Upload files to Walrus if provided
            if (files && files.length > 0) {
                for (let i = 0; i < files.length; i++) {
                    const file = files[i];
                    try {
                        const formData = new FormData();
                        formData.append('file', file);

                        const response = await fetch(`${service.publisherUrl}/v1/store`, {
                            method: 'PUT',
                            body: formData,
                        });

                        if (!response.ok) {
                            throw new Error(`Walrus upload failed for ${file.name}: ${response.statusText}`);
                        }

                        const result = await response.json();
                        const blobId = result.newlyCreated?.blobObject?.blobId || 
                                      result.alreadyCertified?.blobId;
                        
                        if (!blobId) {
                            throw new Error(`Failed to get blob ID for ${file.name}`);
                        }

                        fileBlobIds.push(blobId);
                        toast.success(`Uploaded: ${file.name}`);
                    } catch (error) {
                        console.error(`Error uploading file ${file.name}:`, error);
                        toast.error(`Failed to upload ${file.name}`);
                    }
                }
            }

            // Update task with content blob ID if available
            if (contentBlobId) {
                tx.moveCall({
                    target: `${packageId}::task_manage::add_content`,
                    arguments: [
                        tx.object(versionObjectId), // version: &Version
                        tx.object(taskId), // task: &mut Task
                        tx.pure.option("string", contentBlobId), // content_blob_id: Option<String>
                        tx.object("0x6"), // clock: &Clock
                    ],
                });
            }

            // Update task with file blob IDs if available
            if (fileBlobIds.length > 0) {
                tx.moveCall({
                    target: `${packageId}::task_manage::add_files`,
                    arguments: [
                        tx.object(versionObjectId), // version: &Version
                        tx.object(taskId), // task: &mut Task
                        tx.pure.vector("string", fileBlobIds), // file_blob_ids: vector<String>
                        tx.object("0x6"), // clock: &Clock
                    ],
                });
            }

            // Execute transaction if we have any updates
            if (contentBlobId || fileBlobIds.length > 0) {
                const resp = await signAndExecuteTransaction({
                    transaction: tx,
                });
                
                await suiClient.waitForTransaction({ digest: resp.digest });
                await queryClient.invalidateQueries({
                    queryKey: ["testnet", "getObject"],
                });

                toast.success("Task updated successfully!", {
                    description: `Added ${contentBlobId ? 'content' : ''} ${contentBlobId && fileBlobIds.length > 0 ? 'and' : ''} ${fileBlobIds.length > 0 ? `${fileBlobIds.length} file(s)` : ''}`,
                });

                // Reset form
                setContent("");
                setFiles(null);
                // Reset file input
                const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
                if (fileInput) fileInput.value = '';
            } else {
                toast.error("No content or files to upload");
            }
        } catch (error) {
            console.error("Error uploading:", error);
            toast.error("Failed to update task", {
                description: error instanceof Error ? error.message : "An unexpected error occurred",
            });
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <Card className="p-6">
            <CardContent className="space-y-6 p-0">
                <h2 className="text-xl font-bold">Add Content and Files</h2>

                {/* --- Walrus Service --- */}
                <div className="space-y-2">
                    <Label className="text-base font-medium">
                        Walrus Service
                    </Label>
                    <Select
                        onValueChange={(value) => setSelectedService(value)}
                        value={selectedService}
                        disabled={isUploading}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Select a service" />
                        </SelectTrigger>
                        <SelectContent>
                            {walrusServices.map((service) => (
                                <SelectItem key={service.id} value={service.id}>
                                    {service.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* --- Content --- */}
                <div className="space-y-2">
                    <Label className="text-base font-medium">Content</Label>
                    <Textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="Enter task content... This will be encrypted and stored on Walrus"
                        rows={6}
                        disabled={isUploading}
                    />
                </div>

                {/* --- Files --- */}
                <div className="space-y-2">
                    <Label className="text-base font-medium">Files</Label>
                    <input
                        type="file"
                        multiple
                        onChange={(e) => setFiles(e.target.files)}
                        disabled={isUploading}
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm file:mr-4 file:rounded-md file:border-0 file:bg-muted file:px-3 file:py-1 file:text-sm file:font-medium hover:file:bg-muted/80"
                    />
                    <p className="text-sm text-muted-foreground">
                        Select multiple files to attach. Files will be encrypted
                        and stored on Walrus.
                    </p>
                </div>

                {/* --- Uploading indicator --- */}
                {isUploading && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Encrypting and uploading to Walrus...</span>
                    </div>
                )}

                {/* --- Upload button --- */}
                <Button
                    onClick={handleUpload}
                    disabled={
                        isUploading ||
                        !taskId ||
                        (!content.trim() && (!files || files.length === 0))
                    }
                    size="lg"
                    className="w-full"
                >
                    {isUploading
                        ? "Uploading..."
                        : "Encrypt & Upload to Walrus"}
                </Button>
            </CardContent>
        </Card>
    );
};
