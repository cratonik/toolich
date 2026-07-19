"use client";

import React from "react";
import { WifiOff, RotateCw } from "lucide-react";

export default function OfflinePage() {
  const handleReload = () => {
    window.location.reload();
  };

  return (
    <main className="flex min-h-[80vh] flex-col items-center justify-center px-6 py-12 text-center">
      <div className="relative mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-red-500/10 text-red-500 animate-pulse">
        <WifiOff className="h-12 w-12" />
        <span className="absolute right-2 top-2 flex h-3 w-3">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"></span>
          <span className="relative inline-flex h-3 w-3 rounded-full bg-red-500"></span>
        </span>
      </div>

      <h1 className="font-brand text-2xl font-bold tracking-tight text-neutral-800 dark:text-neutral-100 sm:text-3xl">
        You are offline
      </h1>

      <p className="mt-3 max-w-md text-sm text-neutral-500 dark:text-neutral-400 sm:text-base">
        It looks like you've lost your connection. Check your internet settings or try reloading the page once you're back online.
      </p>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <button
          onClick={handleReload}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-neutral-900 px-6 py-3 text-sm font-semibold text-white shadow-lg transition duration-200 hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200"
        >
          <RotateCw className="h-4 w-4" />
          Retry Connection
        </button>
        <a
          href="/"
          className="inline-flex items-center justify-center rounded-xl border border-neutral-200 px-6 py-3 text-sm font-semibold text-neutral-600 transition duration-200 hover:bg-neutral-50 dark:border-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-900"
        >
          Go to Homepage
        </a>
      </div>
    </main>
  );
}
