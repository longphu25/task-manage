"use client";

import { useCurrentAccount } from "@mysten/dapp-kit";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useWalletStorage } from "@/hooks/use-wallet-storage";

export default function Home() {
  const router = useRouter();
  const currentAccount = useCurrentAccount();
  const { loadWalletFromStorage } = useWalletStorage();

  useEffect(() => {
    // Check if wallet is already connected
    // if (currentAccount?.address) {
    //   // Wallet connected via dApp kit - redirect to dashboard
    //   router.push("/dashboard");
    //   return;
    // }

    // // Check if wallet is stored in localStorage (passkey)
    // const savedWallet = loadWalletFromStorage();
    // if (savedWallet?.account?.address) {
    //   // Wallet found in storage - redirect to dashboard
    //   router.push("/dashboard");
    //   return;
    // }

    // No wallet connected - redirect to login
    router.push("/login");
  }, [currentAccount, router, loadWalletFromStorage]);

  // Show loading state while redirecting
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-gray-900" />
        <p className="text-sm text-gray-500">Loading...</p>
      </div>
    </div>
  );
}
