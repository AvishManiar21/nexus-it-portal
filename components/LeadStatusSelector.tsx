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
    { value: "new", label: "New" },
    { value: "contacted", label: "Contacted" },
    { value: "converted", label: "Converted" },
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

  return (
    <div>
      <label htmlFor="lead-status" className="field-label">Status</label>
      <select
        id="lead-status"
        value={status}
        onChange={handleStatusChange}
        disabled={isUpdating}
        className="field-input w-40 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
      >
        {statuses.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </select>
      {error && (
        <p role="alert" className="text-sm text-red-700 mt-1">
          {error}
        </p>
      )}
      {isUpdating && (
        <p className="text-xs text-muted mt-1">
          Updating...
        </p>
      )}
    </div>
  );
}
