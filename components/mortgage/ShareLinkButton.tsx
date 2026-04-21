"use client";
/**
 * ShareLinkButton.tsx
 * Copies current page URL (with encoded scenarios) to clipboard.
 * Falls back to a prompt dialog with the URL for manual copy.
 * Shows brief success/fail feedback after click.
 */

import { useState, useCallback } from "react";

interface ShareLinkButtonProps {
  label?: string;
  successLabel?: string;
  failLabel?: string;
  className?: string;
}

export default function ShareLinkButton({
  label = "Chia Sẻ Link",
  successLabel = "Đã sao chép link!",
  failLabel = "Không thể sao chép tự động.",
  className = "",
}: ShareLinkButtonProps) {
  const [status, setStatus] = useState<"idle" | "success" | "fail">("idle");

  const handleShare = useCallback(async () => {
    if (typeof window === "undefined") return;

    const url = window.location.href;

    try {
      await navigator.clipboard.writeText(url);
      setStatus("success");
    } catch {
      // Clipboard API not available (older browser / non-HTTPS)
      setStatus("fail");
      // Fallback: prompt user to copy manually
      window.prompt("Sao chép link này:", url);
    }

    // Reset label after 2.5s
    setTimeout(() => setStatus("idle"), 2500);
  }, []);

  const displayLabel =
    status === "success"
      ? successLabel
      : status === "fail"
        ? failLabel
        : label;

  const isSuccess = status === "success";
  const isFail = status === "fail";

  return (
    <button
      type="button"
      onClick={handleShare}
      className={`no-print inline-flex items-center gap-2 rounded-md border px-4 py-2 text-sm font-medium shadow-sm transition-colors ${
        isSuccess
          ? "border-green-400 bg-green-50 text-green-700"
          : isFail
            ? "border-red-300 bg-red-50 text-red-700"
            : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50 active:bg-gray-100"
      } ${className}`}
      aria-label="Copy share link to clipboard"
    >
      {/* Share / link icon — inline SVG */}
      {isSuccess ? (
        // Checkmark icon on success
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
      ) : (
        // Link icon default
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
        </svg>
      )}
      {displayLabel}
    </button>
  );
}
