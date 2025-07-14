import React from "react";
import { Modal, ModalContent, ModalBody, Spinner } from "@heroui/react";

interface LoadingModalProps {
  isOpen: boolean;
  size?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl" | "5xl" | "full";
  spinnerSize?: "sm" | "md" | "lg";
  spinnerColor?: "default" | "primary" | "secondary" | "success" | "warning" | "danger";
}

export const LoadingModal: React.FC<LoadingModalProps> = ({
  isOpen,
  size = "md",
  spinnerSize = "lg",
  spinnerColor = "secondary",
}) => {
  return (
    <Modal
      backdrop="blur"
      isOpen={isOpen}
      placement="top-center"
      classNames={{
        closeButton: "hidden",
        wrapper: "z-[1000000]",
        backdrop: "fixed inset-0 z-[1000000]",
      }}
      className="bg-transparent shadow-none"
      isDismissable={false}
      shadow="sm"
      isKeyboardDismissDisabled={true}
      size={size}
    >
      <ModalContent>
        {() => (
          <>
            <ModalBody className="flex flex-col h-20">
              <Spinner size={spinnerSize} color={spinnerColor} />
            </ModalBody>
          </>
        )}
      </ModalContent>
    </Modal>
  );
};