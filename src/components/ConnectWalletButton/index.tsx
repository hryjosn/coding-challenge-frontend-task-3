import { signingMessage } from "@/services/auth";
import { Button } from "@chakra-ui/react";
import { ConnectButton, useConnectModal } from "@rainbow-me/rainbowkit";
import { ReactNode, useEffect, useState } from "react";
import { SiweMessage, generateNonce } from "siwe";
import { useAccount, useDisconnect, useSignMessage } from "wagmi";
import Dialog from "../Dialog";

const ConnectWalletButton = ({
  className: className = "",
  children,
  disabled,
  onClick: onClick = () => {},
  onSuccess: onSuccess = () => {},
  onError: onError = () => {},
}: {
  name?: string;
  disabled?: boolean;
  children?: ReactNode;
  className?: string;
  onClick?: () => void;
  onSuccess?: (message: SiweMessage, signature: string) => void;
  onError?: () => void;
}) => {
  const { address, isConnected, isConnecting } = useAccount();
  const { connectModalOpen } = useConnectModal();
  const { disconnect } = useDisconnect();
  const [walletDialog, setWalletDialog] = useState<JSX.Element | null>(null);
  const [message, setMessage] = useState<SiweMessage | null>(null);
  const [nonce, setNonce] = useState("");
  const [showConfirmAddress, setShowConfirmAddress] = useState(false);
  const [active, setActive] = useState(false);

  const {
    data: signature,
    isSuccess: isSigned,
    error: signError,
    signMessage,
  } = useSignMessage();

  useEffect(() => {
    disconnect();
  }, []);

  const verifySignature = async (
    message: SiweMessage,
    signature: string,
    nonce: string
  ) => {
    try {
      await message.verify({
        signature,
        nonce,
      });
      return true;
    } catch (error) {
      return false;
    }
  };

  const reset = () => {
    setShowConfirmAddress(false);
    setWalletDialog(null);
    setMessage(null);
    setNonce("");
  };

  const cancel = () => {
    reset();
    disconnect();
  };

  const handleSignMessage = (address: string): void => {
    try {
      // Create a message to sign
      const nonce = generateNonce();
      setNonce(nonce);
      const messageToSign = signingMessage(address, nonce);
      setMessage(messageToSign);
      // Sign the message
      signMessage({
        account: address as `0x${string}`,
        message: messageToSign.prepareMessage(),
      });
    } catch (error) {
      console.error("Error signing message:", error);
    }
  };
  function shortenAddress(address: string) {
    const length = address.length;
    const prefixLength = 6;
    const suffixLength = 4;
    return `${address.substring(0, prefixLength)}...${address.substring(length - suffixLength, length)}`;
  }
  const handleOpenConnectModal = (
    connected: boolean,
    openConnectModal: () => void
  ) => {
    if (!connected) {
      openConnectModal();
      setShowConfirmAddress(true);
    }
  };
  useEffect(() => {
    (async () => {
      if (signature && message) {
        const result = await verifySignature(
          message!,
          signature!.toString(),
          nonce
        );

        setActive(result);
        onSuccess(message, signature.toString());
      }
    })();
  }, [message, nonce, onSuccess, signature]);

  return (
    <>
      <ConnectButton.Custom>
        {({ account, chain, openConnectModal, mounted }) => {
          const ready = mounted;
          const connected = !!(ready && account && chain);
          return (
            <>
              <Button
                variant="ghost"
                className={"min-w-fit " + className}
                onClick={() => {
                  handleOpenConnectModal(
                    connected || isConnected,
                    openConnectModal
                  );
                }}
                isDisabled={disabled}
                isLoading={active && (isConnecting || !ready)}
                padding={0}
              >
                {children}
              </Button>
            </>
          );
        }}
      </ConnectButton.Custom>
      <Dialog
        isOpen={showConfirmAddress && !!address}
        onClose={() => setShowConfirmAddress(false)}
        title="Confirm Wallet"
      >
        <div className="flex flex-col items-center">
          <div className="uppercase my-4">
            You are connecting the following address
          </div>
          {address && (
            <div className="flex justify-center items-center uppercase my-4 bg-zinc-500 rounded-full w-[200px] h-[30px]">
              {shortenAddress(address!)}
            </div>
          )}
          <div className="flex my-4">
            <Button
              className="uppercase mr-3 bg-zinc-700 px-4 py-2"
              onClick={() => {
                cancel();
              }}
            >
              change account
            </Button>
            <Button
              className="uppercase bg-blue-500 px-4 py-2"
              onClick={async () => {
                handleSignMessage(address!);
                setShowConfirmAddress(false);
              }}
            >
              confirm
            </Button>
          </div>
        </div>
      </Dialog>
      {active && address && <div>Your wallet address: {address} is valid!</div>}
    </>
  );
};

export default ConnectWalletButton;
