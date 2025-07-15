import React, { FC, ReactNode, useMemo } from "react";
import {
  ConnectionProvider,
  WalletProvider
} from "@solana/wallet-adapter-react";
import {
  WalletModalProvider,
  WalletMultiButton
} from "@solana/wallet-adapter-react-ui";
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter
} from "@solana/wallet-adapter-wallets";
import { RPC_URL } from "../utils/honeycomb";

// Import default styles
import '@solana/wallet-adapter-react-ui/styles.css';

export const WalletConnectionProvider: FC<{ children: ReactNode }> = ({ children }) => {
  // Use Honeycomb's test network (Honeynet)
  const endpoint = useMemo(() => RPC_URL, []);

  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter()
    ],
    []
  );

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect={false}>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};

// Enhanced wallet button component
export const WalletButton: FC = () => {
  return (
    <WalletMultiButton className="!bg-gradient-to-r !from-purple-600 !to-blue-600 !text-white !px-4 !py-2 !rounded-lg !font-semibold !transition-all !duration-200 hover:!from-purple-700 hover:!to-blue-700" />
  );
};