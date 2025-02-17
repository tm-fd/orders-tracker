// SharedModal.tsx
import React from 'react';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
} from "@heroui/react";

interface SharedModalProps {
  isOpen: boolean;
  onOpenChange: () => void;
  title?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  errorMessage?: string;
}

export function SharedModal({
  isOpen,
  onOpenChange,
  title,
  children,
  footer,
  errorMessage,
}: SharedModalProps) {
  return (
    <Modal
      size="5xl"
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      placement="top-center"
      scrollBehavior="inside"
    >
      <ModalContent>
        {(onClose) => (
          <>
            {title && <ModalHeader>{title}</ModalHeader>}
            <ModalBody>{children}</ModalBody>
            {footer && <ModalFooter>{footer}</ModalFooter>}
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
