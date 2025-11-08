import { useSuiClient, useSuiClientQuery } from "@mysten/dapp-kit";
import { useEffect, useState } from "react";
import { TaskItem } from "@/types";
import { SuiObjectResponse } from "@mysten/sui/client";

// Status constants from Move contract
const STATUS_TODO = 0;
const STATUS_IN_PROGRESS = 1;
const STATUS_COMPLETED = 2;

// Helper function to convert Move task data to TaskItem
const convertToTaskItem = (taskObject: SuiObjectResponse): TaskItem | null => {
  try {
    if (!taskObject?.data?.content) {
      console.warn("Task object has no content:", taskObject);
      return null;
    }
    if (taskObject.data.content.dataType !== "moveObject") {
      console.warn("Task content is not a moveObject:", taskObject.data.content.dataType);
      return null;
    }

    const fields = taskObject.data.content.fields as Record<string, unknown>;
    const objectId = taskObject.data.objectId;

    const dueDate = fields.due_date as { vec: string[] } | undefined;
    const createdAt = fields.created_at as string;
    const status = fields.status as number;
    const assignee = fields.assignee as { vec: string[] } | undefined;

    console.log("Converting task:", { objectId, fields });

    return {
      id: objectId,
      title: String(fields.title || ""),
      description: String(fields.description || ""),
      creator: String(fields.creator || ""),
      is_completed: status === STATUS_COMPLETED,
      created_at: new Date(parseInt(createdAt)).toISOString(),
      due_date: dueDate?.vec?.[0]
        ? new Date(parseInt(dueDate.vec[0])).toISOString()
        : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      priority: String(fields.priority || 1),
      assignee: assignee?.vec?.[0] || undefined,
    };
  } catch (error) {
    console.error("Error converting task:", error, taskObject);
    return null;
  }
};

export const useTaskRegistry = (registryId: string | undefined) => {
  const client = useSuiClient();
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [isLoadingTasks, setIsLoadingTasks] = useState(false);
  const [taskIds, setTaskIds] = useState<string[]>([]);

  // Fetch the registry object to get dynamic field info
  const { data: registryData, isLoading: isLoadingRegistry, isError } = useSuiClientQuery(
    "getObject",
    {
      id: registryId!,
      options: {
        showContent: true,
      },
    },
    {
      enabled: !!registryId,
    }
  );

  // Fetch task IDs from dynamic fields
  useEffect(() => {
    const fetchTaskIds = async () => {
      if (!registryId || !registryData?.data?.content) return;
      if (registryData.data.content.dataType !== "moveObject") return;

      try {
        setIsLoadingTasks(true);
        
        // Get the tasks_by_status Table object ID
        const fields = registryData.data.content.fields as Record<string, unknown>;
        const tasksByStatus = fields.tasks_by_status as {
          type: string;
          fields: {
            id: { id: string };
            size: string;
          };
        };

        const tableId = tasksByStatus.fields.id.id;
        console.log("Table ID:", tableId);

        // Get all dynamic fields from the Table object
        const dynamicFields = await client.getDynamicFields({
          parentId: tableId,
        });

        console.log("Dynamic fields:", dynamicFields);

        const allTaskIds: string[] = [];

        // Fetch task IDs for each status
        for (const field of dynamicFields.data) {
          try {
            const fieldObject = await client.getDynamicFieldObject({
              parentId: tableId,
              name: field.name,
            });

            console.log("Field object:", fieldObject);

            if (fieldObject.data?.content && "fields" in fieldObject.data.content) {
              const fieldContent = fieldObject.data.content.fields as Record<string, unknown>;
              const taskIdsVector = fieldContent.value as string[];
              
              if (Array.isArray(taskIdsVector) && taskIdsVector.length > 0) {
                console.log(`Found ${taskIdsVector.length} tasks for status:`, field.name);
                allTaskIds.push(...taskIdsVector);
              }
            }
          } catch (err) {
            console.warn(`Could not fetch tasks for field:`, field.name, err);
          }
        }

        console.log("All task IDs:", allTaskIds);
        setTaskIds(allTaskIds);
      } catch (error) {
        console.error("Error fetching task IDs:", error);
      } finally {
        setIsLoadingTasks(false);
      }
    };

    fetchTaskIds();
  }, [registryId, registryData, client]);

  // Fetch actual task objects
  useEffect(() => {
    const fetchTasks = async () => {
      if (taskIds.length === 0) {
        setTasks([]);
        return;
      }

      try {
        setIsLoadingTasks(true);

        console.log("Fetching task objects for IDs:", taskIds);

        const taskObjects = await client.multiGetObjects({
          ids: taskIds,
          options: {
            showContent: true,
            showOwner: true,
          },
        });

        console.log("Task objects:", taskObjects);

        const convertedTasks = taskObjects
          .map(convertToTaskItem)
          .filter((task): task is TaskItem => task !== null);

        console.log("Converted tasks:", convertedTasks);

        setTasks(convertedTasks);
      } catch (error) {
        console.error("Error fetching tasks:", error);
        setTasks([]);
      } finally {
        setIsLoadingTasks(false);
      }
    };

    fetchTasks();
  }, [taskIds, client]);

  return {
    tasks,
    isLoading: isLoadingRegistry || isLoadingTasks,
    isError,
    refetch: async () => {
      // Trigger refetch by clearing task IDs
      setTaskIds([]);
    },
  };
};
