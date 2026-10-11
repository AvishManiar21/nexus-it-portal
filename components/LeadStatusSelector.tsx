"use client";

import { BACKEND_API_URL } from "@/lib/backend";
import { useState, ChangeEvent, useRef } from "react";
import { useRouter } from "next/navigation";

interface LeadStatusSelectorProps {
  leadId: number;
  currentStatus: string;
  onStatusChange?: (newStatus: string) => void;
}

export default function LeadStatusSelector({
  leadId,
  currentStatus,
  onStatusChange,
}: LeadStatusSelectorProps) {
  const router = useRouter();
  const [status, setStatus] = useState(currentStatus);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState("");
  const previousStatusRef = useRef(currentStatus);

  const statuses = [
    { value: "new", label: "New", color: "bg-blue-100 text-blue-800" },
    { value: "contacted", label: "Contacted", color: "bg-yellow-100 text-yellow-800" },
    { value: "converted", label: "Converted", color: "bg-green-100 text-green-800" },
  ];

  const handleStatusChange = async (e: ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value;

    if (newStatus === status) return;

    // Store current status before attempting update
    const oldStatus = status;
    previousStatusRef.current = oldStatus;

    setIsUpdating(true);
    setError("");

    try {
      const response = await fetch(
        `${BACKEND_API_URL}/leads/${leadId}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({ status: newStatus }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update status");
      }

      const data = await response.json();
      setStatus(data.status);
      previousStatusRef.current = data.status;

      if (onStatusChange) {
        onStatusChange(data.status);
      }

      // Refresh server components to show updated status history
      router.refresh();
    } catch (err) {
      setError("Failed to update status. Please try again.");
      console.error("Error updating status:", err);
      // Revert to previous known-good status on error
      setStatus(previousStatusRef.current);
    } finally {
      setIsUpdating(false);
    }
  };

  const currentStatusConfig = statuses.find(s => s.value === status) || statuses[0];

  return (
    <div>
      <select
        value={status}
        onChange={handleStatusChange}
        disabled={isUpdating}
        className={`inline-block px-3 py-1 rounded-full text-xs font-medium capitalize cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${currentStatusConfig.color}`}
      >
        {statuses.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </select>
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400 mt-1">
          {error}
        </p>
      )}
      {isUpdating && (
        <p className="text-xs text-gray-500 mt-1">
          Updating...
        </p>
      )}
    </div>
  );
}
