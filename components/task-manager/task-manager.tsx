"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Database } from "lucide-react";
import { TaskCard } from "./task-card";
import { SharedTaskItem } from "@/types";
import { SharedTaskCard } from "./shared-task-card";
import { TasksList } from "./tasks-list";
import { useState } from "react";
import { SelectedTask } from "./selected-task";
import { useTaskRegistry } from "@/hooks/use-task-registry";

const mockSharedTasks: SharedTaskItem[] = [
  {
    id: "0x5",
    title: "Review Q3 Financial Report",
    description: "Review the quarterly financial report and provide feedback.",
    creator: "0xabcde...fgh",
    is_completed: false,
    due_date: String(Math.floor(Date.now() / 1000) + 86400 * 5),
    priority: "4",
  },
  {
    id: "0x6",
    title: "Team Brainstorming Session",
    description: "Prepare agenda for the upcoming team brainstorming session.",
    creator: "0x12345...678",
    is_completed: true,
    due_date: "0",
    priority: "2",
  },
];

export const TaskManager = () => {
  const [selectedTask, setSelectedTask] = useState<string>();
  const taskRegistryId = process.env.NEXT_PUBLIC_TASKS_REGISTRY_ID;
  
  // Use custom hook to fetch tasks from registry
  const { tasks, isLoading, isError } = useTaskRegistry(taskRegistryId);

  if (isLoading) {
    return <div className="flex items-center justify-center py-12">Loading tasks...</div>;
  }

  if (isError) {
    return <div className="flex items-center justify-center py-12 text-red-500">
      Could not load task registry. Please check your configuration.
    </div>;
  }

  return (
    <Tabs defaultValue="my-tasks" className="w-full">
      <TabsList className="grid w-full grid-cols-2 mb-8">
        <TabsTrigger value="my-tasks" className="cursor-pointer">
          My Tasks
        </TabsTrigger>
        <TabsTrigger value="shared-tasks" className="cursor-pointer">
          Shared Tasks
        </TabsTrigger>
      </TabsList>

      <TabsContent value="my-tasks" className="space-y-4">
        {tasks.length === 0 ? (
          <div className="text-center py-12 glass-card rounded-lg animate-fade-in">
            <Database className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">No tasks yet</h3>
            <p className="text-muted-foreground">
              Create your first task to get started
            </p>
          </div>
        ) : (
          <TasksList>
            {tasks.map((task) => (
              <TaskCard key={task.id} task={task} onSelect={setSelectedTask} />
            ))}
          </TasksList>
        )}
      </TabsContent>

      <TabsContent value="shared-tasks" className="space-y-4">
        {mockSharedTasks.length === 0 ? (
          <div className="text-center py-12 glass-card rounded-lg animate-fade-in">
            <Database className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">No tasks yet</h3>
            <p className="text-muted-foreground">
              No tasks have been shared with you yet.
            </p>
          </div>
        ) : (
          <TasksList>
            {mockSharedTasks.map((task) => (
              <SharedTaskCard
                key={task.id}
                task={task}
                onSelect={setSelectedTask}
              />
            ))}
          </TasksList>
        )}
      </TabsContent>

      <TabsContent value="create"></TabsContent>

      {selectedTask && (
        <SelectedTask
          selectedTask={selectedTask}
          setSelectedTask={setSelectedTask}
        />
      )}
    </Tabs>
  );
};
