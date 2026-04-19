"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";

export function RefreshButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      className="secondary-button icon-button"
      onClick={() => {
        startTransition(() => {
          router.refresh();
        });
      }}
      disabled={isPending}
      aria-label={isPending ? "Refreshing" : "Refresh"}
    >
      <span className={isPending ? "icon-button__icon icon-button__icon--spinning" : "icon-button__icon"} aria-hidden="true">
        ↻
      </span>
    </button>
  );
}
