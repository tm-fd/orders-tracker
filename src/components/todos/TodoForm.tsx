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
} from "@heroui/react";
import { X } from "lucide-react";
import {
  useTodoStore,
  Todo,
  TodoPriority,
  CreateTodoDto,
  UpdateTodoDto,
} from "@/store/todoStore";
import {
  parseDate,
  parseTime,
  getLocalTimeZone,
} from "@internationalized/date";
import moment from "moment";
import { useSession } from 'next-auth/react';

interface TodoFormProps {
  todo?: Todo | null;
  onSuccess: () => void;
  onCancel: () => void;
}

const TodoForm: React.FC<TodoFormProps> = ({ todo, onSuccess, onCancel }) => {
  const { data: session } = useSession();
  const { createTodo, updateTodo, loading } = useTodoStore();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    priority: TodoPriority.MEDIUM,
    due_date: "",
    reminder_time: "",
    tags: [] as string[],
  });

  const [newTag, setNewTag] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

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
        ? moment(todo.reminder_time).local().format("YYYY-MM-DDTHH:mm")
        : "",
        tags: todo.tags || [],
      });
    }
  }, [todo]);

  useEffect(() => {
    if (formData.due_date && formData.reminder_time) {
      const dueDate = moment(formData.due_date).endOf('day');
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
    const dueDate = moment(formData.due_date).endOf('day'); // Use end of day for due date
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

    try {
      const todoData: CreateTodoDto | UpdateTodoDto = {
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        priority: formData.priority,
        due_date: formData.due_date || undefined,
        reminder_time: formData.reminder_time 
        ? moment(formData.reminder_time).utc().format()
        : undefined,
        tags: formData.tags.length > 0 ? formData.tags : undefined,
      };

      if (todo) {
        await updateTodo(todo.id, todoData, session.user.sessionToken);
      } else {
        await createTodo({
        ...todoData,
        userId: session.user.sessionToken
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

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Title"
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
        placeholder="Enter todo description (optional)"
        value={formData.description}
        onChange={(e) =>
          setFormData((prev) => ({ ...prev, description: e.target.value }))
        }
        minRows={3}
      />

      <Select
        label="Priority"
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

      <div className="space-y-2">
        <label className="text-sm font-medium">Tags</label>
        <div className="flex gap-2">
          <Input
            placeholder="Add a tag"
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1"
          />
          <Button
            type="button"
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
