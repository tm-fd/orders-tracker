"use client";

import React, { useState, useEffect } from "react";
import {
  Button,
  Input,
  Textarea,
  Select,
  SelectItem,
  Chip,
  DatePicker,
  TimeInput,
  Switch,
} from "@heroui/react";
import { X } from "lucide-react";
import {
  useTodoStore,
  Todo,
  TodoPriority,
  CreateTodoDto,
  UpdateTodoDto,
  AdminUser,
} from "@/store/todoStore";
import {
  parseDate,
  parseTime,
  getLocalTimeZone,
} from "@internationalized/date";
import moment from "moment";
import { useSession } from "next-auth/react";

interface TodoFormProps {
  todo?: Todo | null;
  onSuccess: () => void;
  onCancel: () => void;
}

const TodoForm: React.FC<TodoFormProps> = ({ todo, onSuccess, onCancel }) => {
  const { data: session, status } = useSession();
  const { createTodo, updateTodo, adminUsers, fetchAdminUsers, loading } =
    useTodoStore();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    priority: TodoPriority.MEDIUM,
    due_date: "",
    reminder_time: "",
    tags: [] as string[],
    assigned_to: "",
    is_private: false,
  });

  const [newTag, setNewTag] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (status === "authenticated" && session?.user?.sessionToken) {
      fetchAdminUsers(session.user.sessionToken);
    }
  }, [session, status]);

  useEffect(() => {
    if (todo) {
      setFormData({
        title: todo.title,
        description: todo.description || "",
        priority: todo.priority,
        due_date: todo.due_date
          ? moment(todo.due_date).format("YYYY-MM-DD")
          : "",
        reminder_time: todo.reminder_time
          ? moment(todo.reminder_time).format("YYYY-MM-DDTHH:mm")
          : "",
        tags: todo.tags || [],
        assigned_to: todo.assigned_to || "",
        is_private: todo.is_private || false,
      });
    }
  }, [todo]);

  useEffect(() => {
    if (
      formData.is_private &&
      formData.assigned_to &&
      formData.assigned_to !== session?.user?.id
    ) {
      // If todo is private and assigned to someone else, reset assignment
      setFormData((prev) => ({
        ...prev,
        assigned_to: "",
        is_private: false,
      }));
    }
  }, [formData.is_private, formData.assigned_to, session?.user?.id]);

  useEffect(() => {
    if (formData.due_date && formData.reminder_time) {
      const dueDate = moment(formData.due_date).endOf("day");
      const reminderDate = moment(formData.reminder_time);

      if (reminderDate.isSameOrBefore(dueDate)) {
        // Clear the error if the dates are now valid
        setErrors((prev) => ({
          ...prev,
          reminder_time: undefined,
        }));
      }
    }
  }, [formData.due_date, formData.reminder_time]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = "Title is required";
    }

    if (formData.due_date && formData.reminder_time) {
      const dueDate = moment(formData.due_date).endOf("day"); // Use end of day for due date
      const reminderDate = moment(formData.reminder_time);

      if (reminderDate.isAfter(dueDate)) {
        newErrors.reminder_time = "Reminder time cannot be after due date";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }
    const localTime = moment(formData.reminder_time);
    const utcTime = localTime.utc().format();
    try {
      const todoData: CreateTodoDto | UpdateTodoDto = {
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        priority: formData.priority,
        due_date: formData.due_date || undefined,
        reminder_time: utcTime || undefined,
        tags: formData.tags.length > 0 ? formData.tags : undefined,
        assigned_to: formData.assigned_to || undefined,
        is_private: formData.is_private,
      };

      if (todo) {
        await updateTodo(
          todo.id,
          todoData,
          session.user.sessionToken,
          session.user.role
        );
      } else {
        await createTodo({
          ...todoData,
          userId: session.user.sessionToken,
          role: session.user.role,
        });
      }

      onSuccess();
    } catch (error) {
      console.error("Failed to save todo:", error);
    }
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()],
      }));
      setNewTag("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addTag();
    }
  };

  const canMakePrivate =
    !formData.assigned_to || // No assignee
    formData.assigned_to === session?.user?.id; // Assigned to self

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Title"
        aria-label="Enter todo title"
        placeholder="Enter todo title"
        value={formData.title}
        onChange={(e) =>
          setFormData((prev) => ({ ...prev, title: e.target.value }))
        }
        isRequired
        errorMessage={errors.title}
        isInvalid={!!errors.title}
      />

      <Textarea
        label="Description"
        aria-label="Enter todo description"
        placeholder="Enter todo description (optional)"
        value={formData.description}
        onChange={(e) =>
          setFormData((prev) => ({ ...prev, description: e.target.value }))
        }
        minRows={3}
      />

      <Select
        label="Priority"
        aria-label="Select priority"
        selectedKeys={[formData.priority]}
        onChange={(e) =>
          setFormData((prev) => ({
            ...prev,
            priority: e.target.value as TodoPriority,
          }))
        }
      >
        {Object.values(TodoPriority).map((priority) => (
          <SelectItem key={priority} value={priority}>
            {priority}
          </SelectItem>
        ))}
      </Select>

      <Input
        type="date"
        label="Due Date"
        aria-label="Select due date"
        placeholder="Select due date (optional)"
        value={formData.due_date}
        onChange={(e) => {
          setFormData((prev) => ({ ...prev, due_date: e.target.value }));
          setErrors((prev) => ({
            ...prev,
            reminder_time: undefined,
          }));
        }}
      />

      <Input
        type="datetime-local"
        label="Reminder Time"
        aria-label="Select reminder time"
        placeholder="Select reminder time (optional)"
        value={formData.reminder_time}
        onChange={(e) => {
          setFormData((prev) => ({ ...prev, reminder_time: e.target.value }));
          setErrors((prev) => ({
            ...prev,
            reminder_time: undefined,
          }));
        }}
        errorMessage={errors.reminder_time}
        isInvalid={!!errors.reminder_time}
        description="You'll receive a notification at this time"
      />

      {canMakePrivate && (
        <Switch
          label="Private Todo"
          aria-label="Make todo private"
          isSelected={formData.is_private}
          color="secondary"
          onChange={(e) => {
            const checked = e.target.checked;
            setFormData((prev) => ({
              ...prev,
              is_private: checked,
              // If making private, ensure it's only assigned to self
              assigned_to: checked ? session?.user?.id : prev.assigned_to,
            }));
          }}
          description="Only you can see and get reminders for private todos"
        >
          {formData.is_private ? "Private" : "Public"}
        </Switch>
      )}

      <Select
        label="Assign To"
        aria-label="Select assignee"
        placeholder="Select assignee (optional)"
        selectedKeys={
          formData.assigned_to ? new Set([formData.assigned_to]) : new Set()
        }
        onChange={(e) =>
          setFormData((prev) => ({
            ...prev,
            assigned_to: e.target.value,
          }))
        }
      >
        <SelectItem key="unassigned" value="">
          Unassigned
        </SelectItem>
        {adminUsers.map((user) => (
          <SelectItem key={user.id}>{user.name}</SelectItem>
        ))}
      </Select>

      <div className="space-y-2">
        <label className="text-sm font-medium">Tags</label>
        <div className="flex gap-2">
          <Input
            placeholder="Add a tag"
            aria-label="Add a tag"
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1"
          />
          <Button
            type="button"
            aria-label="Add tag"
            onPress={addTag}
            isDisabled={!newTag.trim()}
            variant="bordered"
          >
            Add
          </Button>
        </div>

        {formData.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {formData.tags.map((tag, index) => (
              <Chip
                key={index}
                onClose={() => removeTag(tag)}
                variant="flat"
                color="primary"
              >
                {tag}
              </Chip>
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button
          type="button"
          variant="light"
          onPress={onCancel}
          isDisabled={loading}
        >
          Cancel
        </Button>
        <Button type="submit" color="secondary" isLoading={loading}>
          {todo ? "Update Todo" : "Create Todo"}
        </Button>
      </div>
    </form>
  );
};

export default TodoForm;
