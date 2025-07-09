"use client";

import React, { useState, useEffect } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  Select,
  SelectItem,
  Chip,
} from "@heroui/react";
import {
  useTodoStore,
  TodoPriority,
  CreateTodoDto,
} from "@/store/todoStore";
import moment from "moment";
import { useSession } from "next-auth/react";

interface CreateTodoModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPurchases: any[];
  onSuccess: () => void;
}

const CreateTodoModal: React.FC<CreateTodoModalProps> = ({
  isOpen,
  onClose,
  selectedPurchases,
  onSuccess,
}) => {
  const { data: session } = useSession();
  const { createTodo, adminUsers, fetchAdminUsers, loading } = useTodoStore();

  const [formData, setFormData] = useState({
    assignedTo: "",
    reminderTime: "",
    dueDate: "",
    priority: TodoPriority.HIGH,
  });

  useEffect(() => {
    if (session?.user?.sessionToken) {
      fetchAdminUsers(session.user.sessionToken);
    }
  }, [session, fetchAdminUsers]);

  useEffect(() => {
    // Reset form when modal opens
    if (isOpen) {
      setFormData({
        assignedTo: "",
        reminderTime: "",
        dueDate: "",
        priority: TodoPriority.HIGH,
      });
    }
  }, [isOpen]);

  const handleSubmit = async () => {
    if (!session?.user?.sessionToken) return;

    try {
      // Create a todo for each selected purchase
      const promises = selectedPurchases.map(async (purchase) => {
        const todoData: CreateTodoDto = {
          title: `Missing Shipping - Order ${purchase.orderNumber}`,
          description: `Customer: ${purchase.customerName} (${purchase.email})\nOrder Number: ${purchase.orderNumber}\nConfirmation Code: ${purchase.confirmationCode}\nVR Glasses: ${purchase.numberOfVrGlasses}\nLicenses: ${purchase.numberOfLicenses}`,
          priority: formData.priority,
          assigned_to: formData.assignedTo || undefined,
          reminder_time: formData.reminderTime ? moment(formData.reminderTime).utc().format() : undefined,
          due_date: formData.dueDate ? moment(formData.dueDate).utc().format() : undefined,
          tags: ["shipping", "missing", purchase.orderNumber],
          metadata: {
            purchaseId: purchase.id,
            orderNumber: purchase.orderNumber,
            type: "shipping_missing"
          },
        };

        return createTodo({
          ...todoData,
          userId: session.user.sessionToken,
          role: session.user.role,
        });
      });

      await Promise.all(promises);
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Failed to create todos:", error);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="2xl">
      <ModalContent>
        <ModalHeader className="!p-5">
          Create Todos for Missing Shipments
        </ModalHeader>
        <ModalBody>
          <div className="space-y-4">
            <div className="p-4 bg-default-50 rounded-lg">
              <h4 className="font-semibold mb-2">Selected Purchases ({selectedPurchases.length})</h4>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {selectedPurchases.map((purchase) => (
                  <div key={purchase.id} className="flex justify-between items-center text-sm">
                    <span>{purchase.orderNumber} - {purchase.customerName}</span>
                    <Chip size="sm" variant="flat">{purchase.email}</Chip>
                  </div>
                ))}
              </div>
            </div>

            <Select
              label="Assign To"
              placeholder="Select assignee (optional)"
              selectedKeys={formData.assignedTo ? new Set([formData.assignedTo]) : new Set()}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  assignedTo: e.target.value,
                }))
              }
            >
              <SelectItem key="unassigned" value="">
                Unassigned
              </SelectItem>
              {adminUsers.map((user) => (
                <SelectItem key={user.id} value={user.id}>
                  {user.name}
                </SelectItem>
              ))}
            </Select>

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
              type="datetime-local"
              label="Due Date"
              placeholder="Select due date (optional)"
              value={formData.dueDate}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  dueDate: e.target.value,
                }))
              }
              description="When this todo should be completed"
            />

            <Input
              type="datetime-local"
              label="Reminder Time"
              placeholder="Select reminder time (optional)"
              value={formData.reminderTime}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  reminderTime: e.target.value,
                }))
              }
              description="You'll receive a notification at this time"
            />
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="light" onPress={onClose} isDisabled={loading}>
            Cancel
          </Button>
          <Button
            color="primary"
            className="text-black"
            onPress={handleSubmit}
            isLoading={loading}
            isDisabled={selectedPurchases.length === 0}
          >
            Create {selectedPurchases.length} Todo{selectedPurchases.length !== 1 ? 's' : ''}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default CreateTodoModal;