"use client";

import { useState } from "react";
import { useSignAndExecuteTransaction, useSuiClient, useCurrentAccount } from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import { isValidSuiAddress } from "@mysten/sui/utils";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
    Card,
    CardHeader,
    CardTitle,
    CardContent,
    CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { ROLE_VIEWER, ROLE_EDITOR, ROLE_OWNER } from "@/types";

interface ShareTaskProps {
    taskId: string | undefined;
    onShared?: () => void;
}

export function ShareTask({ taskId, onShared }: ShareTaskProps) {
    const [userAddress, setUserAddress] = useState("");
    const [selectedRole, setSelectedRole] = useState(String(ROLE_VIEWER));
    const [isSharing, setIsSharing] = useState(false);

    const account = useCurrentAccount();
    const suiClient = useSuiClient();
    const queryClient = useQueryClient();
    const { mutateAsync: signAndExecuteTransaction } = useSignAndExecuteTransaction();

    const shareTask = async () => {
        if (!taskId || !account) return;

        const address = userAddress.trim();

        if (!address) {
            toast.error("Please enter a valid address");
            return;
        }

        if (!isValidSuiAddress(address)) {
            toast.error(`Invalid Sui address: ${address}`);
            return;
        }

        const packageId = process.env.NEXT_PUBLIC_PACKAGE_ID;
        const versionObjectId = process.env.NEXT_PUBLIC_VERSION_ID;

        if (!packageId || !versionObjectId) {
            toast.error("Configuration error: Missing package or version ID");
            return;
        }

        setIsSharing(true);

        try {
            const tx = new Transaction();
            
            tx.moveCall({
                target: `${packageId}::task_manage::add_user_with_role`,
                arguments: [
                    tx.object(versionObjectId), // version: &Version
                    tx.object(taskId), // task: &mut Task
                    tx.pure.address(address), // user: address
                    tx.pure.u8(Number(selectedRole)), // role: u8
                    tx.object("0x6"), // clock: &Clock
                ],
            });

            const resp = await signAndExecuteTransaction({
                transaction: tx,
            });
            
            await suiClient.waitForTransaction({ digest: resp.digest });
            await queryClient.invalidateQueries({
                queryKey: ["testnet", "getObject"],
            });

            toast.success("Task shared successfully!", {
                description: `Granted ${getRoleLabel(Number(selectedRole))} access to ${address.slice(0, 8)}...`,
            });

            setUserAddress("");
            setSelectedRole(String(ROLE_VIEWER));
            onShared?.();
        } catch (error) {
            console.error("Error sharing task:", error);
            toast.error("Failed to share task", {
                description: error instanceof Error ? error.message : "An unexpected error occurred",
            });
        } finally {
            setIsSharing(false);
        }
    };

    const getRoleLabel = (role: number) => {
        switch (role) {
            case ROLE_VIEWER: return "Viewer";
            case ROLE_EDITOR: return "Editor";
            case ROLE_OWNER: return "Owner";
            default: return "Unknown";
        }
    };

    if (!taskId) return null;

    return (
        <Card className="flex flex-col">
            <CardHeader>
                <CardTitle>Share Task</CardTitle>
            </CardHeader>

            <ScrollArea className="flex-1 px-6">
                <CardContent className="space-y-4 pb-6">
                    <div className="space-y-2">
                        <Label htmlFor="userAddress">
                            User Address
                        </Label>
                        <Input
                            id="userAddress"
                            value={userAddress}
                            onChange={(e) => setUserAddress(e.target.value)}
                            placeholder="0x123..."
                            disabled={isSharing}
                        />
                        <p className="text-sm text-muted-foreground">
                            Enter the Sui wallet address of the user you want to share with.
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="role">Access Role</Label>
                        <Select
                            value={selectedRole}
                            onValueChange={setSelectedRole}
                            disabled={isSharing}
                        >
                            <SelectTrigger id="role">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value={String(ROLE_VIEWER)}>
                                    Viewer - Can view task details
                                </SelectItem>
                                <SelectItem value={String(ROLE_EDITOR)}>
                                    Editor - Can edit task and add comments
                                </SelectItem>
                                <SelectItem value={String(ROLE_OWNER)}>
                                    Owner - Full control including sharing
                                </SelectItem>
                            </SelectContent>
                        </Select>
                        <p className="text-sm text-muted-foreground">
                            Select the level of access for this user.
                        </p>
                    </div>
                </CardContent>
            </ScrollArea>

            <CardFooter className="border-t px-6 py-4">
                <Button
                    onClick={shareTask}
                    disabled={!userAddress.trim() || isSharing}
                    className="w-full"
                >
                    {isSharing ? "Sharing..." : "Grant Access"}
                </Button>
            </CardFooter>
        </Card>
    );
}
