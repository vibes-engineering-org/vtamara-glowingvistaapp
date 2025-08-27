"use client";

import * as React from "react";
import { Button } from "~/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "~/components/ui/sheet";
import { useMiniAppSdk } from "~/hooks/use-miniapp-sdk";
import {
  useAccount,
  useConnect,
  useWaitForTransactionReceipt,
  useWriteContract,
  useSwitchChain,
} from "wagmi";
import { formatEther, type Address } from "viem";
import { farcasterFrame } from "@farcaster/miniapp-wagmi-connector";
import {
  Coins,
  CheckCircle,
  AlertCircle,
  Loader2,
  RefreshCw,
  Wallet,
} from "lucide-react";
import { cn } from "~/lib/utils";
import { getChainById, findChainByName } from "~/lib/chains";

interface SBTMintFlowProps {
  contractAddress: Address;
  network?: string;
  buttonText?: string;
  className?: string;
  variant?: "default" | "destructive" | "secondary" | "ghost" | "outline";
  size?: "default" | "sm" | "lg" | "icon";
  disabled?: boolean;
  onMintSuccess?: (txHash: string) => void;
  onMintError?: (error: string) => void;
}

type MintStep = "idle" | "connecting" | "minting" | "waiting" | "success" | "error";

export function SBTMintFlow({
  contractAddress,
  network = "ethereum",
  buttonText = "Mint SBT",
  className,
  variant = "default",
  size = "default",
  disabled = false,
  onMintSuccess,
  onMintError,
}: SBTMintFlowProps) {
  const [step, setStep] = React.useState<MintStep>("idle");
  const [isSheetOpen, setIsSheetOpen] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Convert network name to chainId
  const targetChain = React.useMemo(() => {
    const foundChain = findChainByName(network);
    if (!foundChain) {
      console.warn(`SBTMintFlow: Network "${network}" not recognized, defaulting to Ethereum mainnet`);
      return getChainById(1);
    }
    return foundChain;
  }, [network]);

  const chainId = targetChain.id;

  const { isSDKLoaded } = useMiniAppSdk();
  const { isConnected, address, chain } = useAccount();
  const { connect } = useConnect();
  const { switchChain } = useSwitchChain();
  const {
    writeContract,
    isPending: isWritePending,
    data: writeData,
    error: writeError,
  } = useWriteContract();

  // Watch for transaction completion
  const {
    isSuccess: isTxSuccess,
    isError: isTxError,
    error: txError,
  } = useWaitForTransactionReceipt({
    hash: writeData,
  });

  // Check if user is on the correct network
  const isCorrectNetwork = chain?.id === chainId;
  const networkName = targetChain.name || "Unknown";

  // Handle transaction status updates
  React.useEffect(() => {
    if (writeError) {
      setError(writeError.message);
      setStep("error");
      onMintError?.(writeError.message);
    }
    if (isTxError && txError) {
      setError(txError.message);
      setStep("error");
      onMintError?.(txError.message);
    }
    if (writeData && !isTxSuccess && !isTxError) {
      setStep("waiting");
    }
    if (isTxSuccess && writeData) {
      setStep("success");
      onMintSuccess?.(writeData);
    }
  }, [
    isTxSuccess,
    writeData,
    onMintSuccess,
    isTxError,
    txError,
    onMintError,
    writeError,
  ]);

  const handleClose = React.useCallback(() => {
    setIsSheetOpen(false);
    setStep("idle");
    setError(null);
  }, []);

  // Auto-close on success after 5 seconds
  React.useEffect(() => {
    if (step === "success") {
      const timer = setTimeout(() => {
        handleClose();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [step, handleClose]);

  const handleSwitchNetwork = async () => {
    try {
      await switchChain({ chainId });
    } catch (err) {
      // Network switch failed
    }
  };

  const handleConnectWallet = async () => {
    try {
      setStep("connecting");
      const connector = farcasterFrame();
      connect({ connector });
    } catch (err) {
      setError("Failed to connect wallet");
      setStep("error");
    }
  };

  const handleMint = async () => {
    if (!isConnected) {
      await handleConnectWallet();
      return;
    }

    if (!isCorrectNetwork) {
      await handleSwitchNetwork();
      return;
    }

    try {
      setStep("minting");

      // Basic ERC721 mint function call
      await writeContract({
        address: contractAddress,
        abi: [
          {
            name: "mint",
            type: "function",
            inputs: [{ name: "to", type: "address" }],
            outputs: [],
            stateMutability: "nonpayable",
          },
        ],
        functionName: "mint",
        args: [address!],
        chainId,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Mint transaction failed";
      setError(message);
      setStep("error");
      onMintError?.(message);
    }
  };

  const handleInitialMint = async () => {
    if (!isSDKLoaded) {
      setError("Farcaster SDK not loaded");
      setStep("error");
      setIsSheetOpen(true);
      return;
    }

    setIsSheetOpen(true);
    
    // If wallet connected and on correct network, mint directly
    if (isConnected && isCorrectNetwork) {
      await handleMint();
    } else {
      // Otherwise show sheet for wallet connection/network switch
      setStep("idle");
    }
  };

  const handleRetry = () => {
    setError(null);
    handleMint();
  };

  return (
    <Sheet
      open={isSheetOpen}
      onOpenChange={(open) => {
        setIsSheetOpen(open);
        if (!open) {
          handleClose();
        }
      }}
    >
      <Button
        variant={variant}
        size={size}
        onClick={handleInitialMint}
        disabled={disabled || !isSDKLoaded}
        className={cn("w-full", className)}
      >
        <Coins className="h-4 w-4 mr-2" />
        {buttonText}
      </Button>

      <SheetContent
        side="bottom"
        className="!bottom-0 !rounded-t-xl !rounded-b-none !max-h-[75vh] !h-auto !px-4 sm:!px-6 !pb-8 pb-safe !w-full !max-w-[400px] !mx-auto !left-1/2 !-translate-x-1/2"
      >
        <SheetHeader className="mb-4">
          <SheetTitle>
            {step === "connecting" && "Connecting Wallet"}
            {step === "minting" && "Preparing Mint"}
            {step === "waiting" && "Minting SBT..."}
            {step === "success" && "SBT Minted Successfully!"}
            {step === "error" && "Transaction Failed"}
            {step === "idle" && "Mint Soulbound Token"}
          </SheetTitle>
        </SheetHeader>

        {/* Main Sheet Content */}
        {step === "idle" && (
          <div className="space-y-6">
            {/* Network warning */}
            {!isCorrectNetwork && isConnected && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 dark:bg-yellow-900/20 dark:border-yellow-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-yellow-600" />
                    <p className="text-sm font-medium">Wrong network</p>
                  </div>
                  <Button
                    onClick={handleSwitchNetwork}
                    size="sm"
                    variant="ghost"
                    className="text-xs"
                  >
                    Switch to {networkName}
                  </Button>
                </div>
              </div>
            )}

            <div className="space-y-4">
              <div className="flex justify-between items-center py-3 border-b">
                <span className="text-neutral-500 dark:text-neutral-400">Token Type</span>
                <span className="font-semibold">Soulbound Token (SBT)</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b gap-2">
                <span className="text-neutral-500 dark:text-neutral-400">Contract</span>
                <span className="font-mono text-xs sm:text-sm">
                  {contractAddress.slice(0, 6)}...{contractAddress.slice(-4)}
                </span>
              </div>
              <div className="flex justify-between items-center py-3 border-b">
                <span className="text-neutral-500 dark:text-neutral-400">Network</span>
                <span className="font-semibold">{networkName}</span>
              </div>
              <div className="flex justify-between items-center py-3 text-lg font-semibold">
                <span>Price</span>
                <span>Free</span>
              </div>
            </div>

            <Button
              onClick={
                !isConnected 
                  ? handleConnectWallet 
                  : !isCorrectNetwork 
                  ? handleSwitchNetwork 
                  : handleMint
              }
              size="lg"
              className="w-full"
              variant={!isConnected || !isCorrectNetwork ? "outline" : "default"}
              disabled={isWritePending}
            >
              {isConnected ? (
                !isCorrectNetwork ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Switch Network to Mint
                  </>
                ) : (
                  <>
                    <Coins className="h-5 w-5 mr-2" />
                    Mint SBT
                  </>
                )
              ) : (
                <>
                  <Wallet className="h-4 w-4 mr-2" />
                  Connect Wallet to Mint
                </>
              )}
            </Button>
          </div>
        )}

        {/* Connecting */}
        {step === "connecting" && (
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <Loader2 className="h-12 w-12 animate-spin text-neutral-900 dark:text-neutral-50" />
            </div>
            <p className="text-neutral-500 dark:text-neutral-400">
              Connecting to your Farcaster wallet...
            </p>
          </div>
        )}

        {/* Minting */}
        {step === "minting" && (
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <Loader2 className="h-12 w-12 animate-spin text-neutral-900 dark:text-neutral-50" />
            </div>
            <div>
              <p className="font-semibold">Preparing mint transaction</p>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                Please approve the transaction in your wallet
              </p>
            </div>
          </div>
        )}

        {/* Waiting for Transaction */}
        {step === "waiting" && (
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <Loader2 className="h-12 w-12 animate-spin text-neutral-900 dark:text-neutral-50" />
            </div>
            <div>
              <p className="font-semibold">Transaction submitted</p>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                Waiting for confirmation on the blockchain...
              </p>
              {writeData && (
                <p className="text-xs font-mono mt-2 px-3 py-1 bg-neutral-100 rounded dark:bg-neutral-800">
                  {writeData.slice(0, 10)}...{writeData.slice(-8)}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Success */}
        {step === "success" && (
          <div className="text-center space-y-6">
            <div className="flex justify-center">
              <CheckCircle className="h-20 w-20 text-green-500" />
            </div>
            <div className="space-y-3">
              <p className="text-2xl font-semibold">SBT Minted!</p>
              <p className="text-neutral-500 dark:text-neutral-400">
                Your Soulbound Token has been successfully minted
              </p>
            </div>
            <Button onClick={handleClose} className="w-full" size="lg">
              Done
            </Button>
          </div>
        )}

        {/* Error State */}
        {step === "error" && (
          <div className="space-y-6">
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="p-3 rounded-full bg-red-50 dark:bg-red-900/20">
                  <AlertCircle className="h-12 w-12 text-red-500" />
                </div>
              </div>
              <div className="space-y-2">
                <p className="font-semibold text-lg">Transaction Failed</p>
                {error && (
                  <p className="text-sm text-neutral-500 max-w-sm mx-auto dark:text-neutral-400">
                    {error}
                  </p>
                )}
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={handleClose}
                className="flex-1"
              >
                Close
              </Button>
              <Button
                onClick={handleRetry}
                className="flex-1"
                disabled={!isCorrectNetwork && isConnected}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}