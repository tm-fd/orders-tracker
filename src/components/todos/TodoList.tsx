"use client";

import React, { useEffect, useState } from "react";
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Chip,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Input,
  Select,
  SelectItem,
  Spinner,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
} from "@heroui/react";
import {
  Plus,
  Search,
  Filter,
  MoreVertical,
  Calendar,
  Clock,
  AlertTriangle,
} from "lucide-react";
import {
  useTodoStore,
  Todo,
  TodoStatus,
  TodoPriority,
  TodoQueryDto,
} from "@/store/todoStore";
import moment from "moment";
import TodoForm from "./TodoForm";
import TodoStats from "./TodoStats";
import { useSession } from "next-auth/react";

const TodoList = () => {
  const { data: session } = useSession();
  const {
    todos,
    loading,
    error,
    fetchTodos,
    updateTodo,
    deleteTodo,
    clearError,
  } = useTodoStore();

  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedTodo, setSelectedTodo] = useState<Todo | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<TodoStatus | "">("");
  const [priorityFilter, setPriorityFilter] = useState<TodoPriority | "">("");
  const [showOverdueOnly, setShowOverdueOnly] = useState(false);
  const [dueDateFilter, setDueDateFilter] = useState<
    "today" | "week" | "all" | ""
  >("");

  useEffect(() => {
    loadTodos();
  }, [
    searchTerm,
    statusFilter,
    priorityFilter,
    showOverdueOnly,
    dueDateFilter,
  ]);

  const loadTodos = async () => {
    const query: TodoQueryDto = {
      limit: "50",
      offset: "0",
      sort_by: "createdAt",
      sort_order: "desc",
    };

    if (searchTerm) query.search = searchTerm;
    if (statusFilter) query.status = statusFilter;
    if (priorityFilter) query.priority = priorityFilter;
    if (showOverdueOnly) query.overdue_only = "true";

    // Add due date filtering
    if (dueDateFilter) {
      const now = moment();
      switch (dueDateFilter) {
        case "today":
          query.due_after = now.startOf("day").toISOString();
          query.due_before = now.endOf("day").toISOString();
          break;
        case "week":
          query.due_after = now.startOf("week").toISOString();
          query.due_before = now.endOf("week").toISOString();
          break;
        case "last_week":
          const startOfLastWeek = now.clone().subtract(1, 'week').startOf('week');
        const endOfLastWeek = now.clone().subtract(1, 'week').endOf('week');
        query.due_after = startOfLastWeek.toISOString();
        query.due_before = endOfLastWeek.toISOString();
          break;
        // 'all' case doesn't need any filters
      }
    }

    await fetchTodos(query, session.user.sessionToken);
  };
  useEffect(() => {
    console.log(todos);
  }, [todos]);

  const handleStatusChange = async (todo: Todo, newStatus: TodoStatus) => {
    try {
      await updateTodo(
        todo.id,
        { status: newStatus },
        session.user.sessionToken
      );
    } catch (error) {
      console.error("Failed to update todo status:", error);
    }
  };

  const handleDeleteTodo = async (todoId: number) => {
    if (confirm("Are you sure you want to delete this todo?")) {
      try {
        await deleteTodo(todoId, session.user.sessionToken);
      } catch (error) {
        console.error("Failed to delete todo:", error);
      }
    }
  };

  const openEditModal = (todo: Todo) => {
    setSelectedTodo(todo);
    onOpen();
  };

  const closeModal = () => {
    setSelectedTodo(null);
    onClose();
  };

  const getPriorityColor = (priority: TodoPriority) => {
    switch (priority) {
      case TodoPriority.URGENT:
        return "danger";
      case TodoPriority.HIGH:
        return "warning";
      case TodoPriority.MEDIUM:
        return "primary";
      case TodoPriority.LOW:
        return "default";
      default:
        return "default";
    }
  };

  const getStatusColor = (status: TodoStatus) => {
    switch (status) {
      case TodoStatus.COMPLETED:
        return "success";
      case TodoStatus.IN_PROGRESS:
        return "primary";
      case TodoStatus.PENDING:
        return "warning";
      case TodoStatus.CANCELLED:
        return "danger";
      default:
        return "default";
    }
  };

  const isOverdue = (todo: Todo) => {
    return (
      todo.due_date &&
      moment(todo.due_date).isBefore(moment()) &&
      todo.status !== TodoStatus.COMPLETED
    );
  };

  if (error) {
    return (
      <Card className="p-4">
        <CardBody>
          <div className="text-center text-red-500">
            <p>Error: {error}</p>
            <Button
              color="primary"
              variant="light"
              onPress={() => {
                clearError();
                loadTodos();
              }}
            >
              Retry
            </Button>
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <TodoStats />

      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Todo List</h1>
        <Button
          startContent={<Plus className="w-4 h-4" />}
          className="bg-blue-600"
          onPress={() => {
            setSelectedTodo(null);
            onOpen();
          }}
        >
          Add Todo
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardBody>
          <div className="flex flex-wrap gap-4 items-center">
            <Input
              placeholder="Search todos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              startContent={<Search className="w-4 h-4" />}
              className="max-w-xs"
            />

            <Select
              placeholder="Filter by status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as TodoStatus)}
              className="w-40"
            >
              <SelectItem key="" value="">
                All Statuses
              </SelectItem>
              {Object.values(TodoStatus).map((status) => (
                <SelectItem key={status} value={status}>
                  {status.replace("_", " ")}
                </SelectItem>
              ))}
            </Select>

            <Select
              placeholder="Filter by priority"
              value={priorityFilter}
              onChange={(e) =>
                setPriorityFilter(e.target.value as TodoPriority)
              }
              className="w-40"
            >
              <SelectItem key="" value="">
                All Priorities
              </SelectItem>
              {Object.values(TodoPriority).map((priority) => (
                <SelectItem key={priority} value={priority}>
                  {priority}
                </SelectItem>
              ))}
            </Select>

            <Select
              placeholder="Filter by due date"
              value={dueDateFilter}
              onChange={(e) =>
                setDueDateFilter(
                  e.target.value as "today" | "week" | "last_week" | "all" | ""
                )
              }
              className="w-40"
            >
              <SelectItem key="" value="">
                All Due Dates
              </SelectItem>
              <SelectItem key="today" value="today">
                Due Today
              </SelectItem>
              <SelectItem key="week" value="week">
                Due This Week
              </SelectItem>
              <SelectItem key="last_week" value="last_week">
                Due Last Week
              </SelectItem>
            </Select>

            <Button
              variant={showOverdueOnly ? "solid" : "bordered"}
              color={showOverdueOnly ? "danger" : "default"}
              onPress={() => setShowOverdueOnly(!showOverdueOnly)}
              startContent={<AlertTriangle className="w-4 h-4" />}
            >
              Overdue Only
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* Todo List */}
      {loading ? (
        <div className="flex justify-center p-8">
          <Spinner size="lg" />
        </div>
      ) : (
        <div className="space-y-4">
          {todos.length === 0 ? (
            <Card>
              <CardBody className="text-center py-8">
                <p className="text-gray-500">No todos found</p>
              </CardBody>
            </Card>
          ) : (
            todos.map((todo) => (
              <Card
                key={todo.id}
                className={`${
                  isOverdue(todo) ? "border-l-4 border-l-red-500" : ""
                }`}
              >
                <CardBody>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-lg">
                            {todo.title}
                          </h3>
                          <Chip
                            color={getPriorityColor(todo.priority)}
                            size="sm"
                            variant="flat"
                          >
                            {todo.priority}
                          </Chip>
                          <Chip
                            color={getStatusColor(todo.status)}
                            size="sm"
                            variant="flat"
                          >
                            {todo.status.replace("_", " ")}
                          </Chip>
                          {isOverdue(todo) && (
                            <Chip color="danger" size="sm" variant="flat">
                              OVERDUE
                            </Chip>
                          )}
                        </div>
                        <div>
                          <Chip color={"default"} size="sm" variant="flat">
                            <span>Created by</span> {todo.created_by_name}
                          </Chip>
                          {todo.assigned_to_name && (
                            <Chip color={"default"} size="sm" variant="flat">
                              Assigned to {todo.assigned_to_name}
                            </Chip>
                          )}
                        </div>
                      </div>

                      {todo.description && (
                        <p className="text-gray-600 mb-2">{todo.description}</p>
                      )}

                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        {todo.due_date && (
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            <span>
                              Due:{" "}
                              {moment(todo.due_date).format("MMM DD, YYYY")}
                            </span>
                          </div>
                        )}
                        {todo.reminder_time && (
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            <span>
                              Reminder:{" "}
                              {moment(todo.reminder_time).format(
                                "MMM DD, YYYY HH:mm"
                              )}
                            </span>
                          </div>
                        )}
                      </div>

                      {todo.tags && todo.tags.length > 0 && (
                        <div className="flex gap-1 mt-2">
                          {todo.tags.map((tag, index) => (
                            <Chip key={index} size="sm" variant="bordered">
                              {tag}
                            </Chip>
                          ))}
                        </div>
                      )}
                    </div>

                    <Dropdown>
                      <DropdownTrigger>
                        <Button isIconOnly variant="light" size="sm">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownTrigger>
                      <DropdownMenu>
                        <DropdownItem onPress={() => openEditModal(todo)}>
                          Edit
                        </DropdownItem>
                        <DropdownItem
                          onPress={() =>
                            handleStatusChange(todo, TodoStatus.IN_PROGRESS)
                          }
                          className={
                            todo.status === TodoStatus.IN_PROGRESS
                              ? "hidden"
                              : ""
                          }
                        >
                          Mark In Progress
                        </DropdownItem>
                        <DropdownItem
                          onPress={() =>
                            handleStatusChange(todo, TodoStatus.COMPLETED)
                          }
                          className={
                            todo.status === TodoStatus.COMPLETED ? "hidden" : ""
                          }
                        >
                          Mark Complete
                        </DropdownItem>
                        <DropdownItem
                          onPress={() => handleDeleteTodo(todo.id)}
                          className="text-danger"
                          color="danger"
                        >
                          Delete
                        </DropdownItem>
                      </DropdownMenu>
                    </Dropdown>
                  </div>
                </CardBody>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Todo Form Modal */}
      <Modal isOpen={isOpen} onClose={closeModal} size="2xl">
        <ModalContent>
          <ModalHeader className="!p-5">
            {selectedTodo ? "Edit Todo" : "Create New Todo"}
          </ModalHeader>
          <ModalBody>
            <TodoForm
              todo={selectedTodo}
              onSuccess={() => {
                closeModal();
                loadTodos();
              }}
              onCancel={closeModal}
            />
          </ModalBody>
        </ModalContent>
      </Modal>
    </div>
  );
};

export default TodoList;
