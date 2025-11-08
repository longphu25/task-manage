import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Share2, Hash } from "lucide-react";
import { format } from "date-fns";
import { TaskItem } from "@/types";
import { getPriorityLabel } from "@/helpers";

interface TaskCardProps {
    task: TaskItem;
    onSelect: (id: string) => void;
}

// Helper function to shorten address/object ID
const shortenAddress = (address: string, chars = 6): string => {
    if (!address) return "";
    if (address.length <= chars * 2) return address;
    return `${address.slice(0, chars)}...${address.slice(-chars)}`;
};

export const TaskCard = ({ task, onSelect }: TaskCardProps) => {
    const priorityInfo = getPriorityLabel(Number(task.priority));
    return (
        <Card
            className="py-4 cursor-pointer hover:shadow-lg transition-all hover:scale-[1.02] animate-fade-in glass-card h-full"
            onClick={() => onSelect(task.id)}
        >
            <div className="flex flex-col justify-between h-full">
                {/* --- Header & Content --- */}
                <div>
                    <CardHeader>
                        <div className="flex items-start justify-between gap-2">
                            <CardTitle className="text-lg">
                                {task.title}
                            </CardTitle>
                            <Badge 
                                variant="default"
                                className={`${
                                    priorityInfo.color === 'red' ? 'bg-red-500' :
                                    priorityInfo.color === 'orange' ? 'bg-orange-500' :
                                    priorityInfo.color === 'blue' ? 'bg-blue-500' :
                                    'bg-green-500'
                                } text-white hover:opacity-90`}
                            >
                                {priorityInfo.label}
                            </Badge>
                        </div>
                        <CardDescription className="line-clamp-2 mb-3">
                            {task.description}
                        </CardDescription>
                        {/* Object ID Badge */}
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                            <Hash className="h-3 w-3" />
                            <span className="font-mono">{shortenAddress(task.id, 8)}</span>
                        </div>
                    </CardHeader>
                </div>

                {/* --- Footer (always bottom) --- */}
                <CardContent className="pt-0">
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {format(new Date(task.due_date), "MMM dd, yyyy")}
                        </div>
                        <div className="flex items-center gap-1">
                            <Share2 className="h-4 w-4" />
                            <span className="font-mono text-xs">{shortenAddress(task.creator, 4)}</span>
                        </div>
                    </div>
                </CardContent>
            </div>
        </Card>
    );
};
