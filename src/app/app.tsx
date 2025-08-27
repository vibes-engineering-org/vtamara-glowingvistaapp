"use client";

import { SBTMintFlow } from "~/components/sbt-mint-flow";

export default function App() {
  return (
    <div className="w-[400px] mx-auto py-8 px-4 min-h-screen flex flex-col items-center justify-center">
      {/* TEMPLATE_CONTENT_START - Replace content below */}
      <div className="space-y-8 text-center">
        <div className="space-y-4">
          <h1 className="text-3xl font-semibold tracking-tight">
            Soulbound Token Minting
          </h1>
          <p className="text-muted-foreground max-w-sm mx-auto">
            Connect your wallet and mint your unique Soulbound Token in just two clicks
          </p>
        </div>
        
        <div className="w-full max-w-sm mx-auto">
          <SBTMintFlow
            contractAddress="0x0000000000000000000000000000000000000000"
            network="base"
            buttonText="Mint Your SBT"
            size="lg"
            className="w-full"
            onMintSuccess={(txHash) => {
              console.log("SBT minted successfully:", txHash);
            }}
            onMintError={(error) => {
              console.error("SBT mint failed:", error);
            }}
          />
        </div>
        
        <div className="text-xs text-muted-foreground">
          <p>Replace the contract address with your actual SBT contract</p>
        </div>
      </div>
      {/* TEMPLATE_CONTENT_END */}
    </div>
  );
}
