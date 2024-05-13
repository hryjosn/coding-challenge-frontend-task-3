import {
  Modal,
  ModalBody,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  ModalProps,
} from "@chakra-ui/react";

export interface DialogProps extends ModalProps {
  title?: string;
}

const Dialog = (props: DialogProps) => {
  const { children, title, ...restProps } = props;
  return (
    <Modal {...restProps} isCentered>
      <ModalOverlay />
      <ModalContent className={"border border-slate-600 w-[500px] bg-black"}>
        <ModalHeader className={"border border-slate-600 p-3"}>{title || "Dialog"}</ModalHeader>
        <ModalBody>{children}</ModalBody>
      </ModalContent>
    </Modal>
  );
};
export default Dialog;
