"use client";

import { BACKEND_API_URL } from "@/lib/backend";
import { useState, FormEvent } from "react";

interface Note {
  id: number;
  note: string;
  author: string;
  created_at: string;
}

interface LeadNotesProps {
  leadId: number;
  initialNotes: Note[];
}

function formatDateTime(dateStr: string) {
  return new Date(dateStr).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function LeadNotes({ leadId, initialNotes }: LeadNotesProps) {
  const [notes, setNotes] = useState<Note[]>(initialNotes);
  const [newNote, setNewNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!newNote.trim()) {
      setError("Note cannot be empty");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const response = await fetch(
        `${BACKEND_API_URL}/leads/${leadId}/notes`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({ note: newNote }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to create note");
      }

      const createdNote = await response.json();
      setNotes((prevNotes) => [createdNote, ...prevNotes]); // Add new note at the top
      setNewNote(""); // Clear the textarea
    } catch (err) {
      setError("Failed to save note. Please try again.");
      console.error("Error creating note:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-lg shadow">
      <div className="p-4 border-b border-gray-200 dark:border-zinc-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Internal Notes
        </h2>
      </div>

      {/* Note Entry Form */}
      <div className="p-4 border-b border-gray-200 dark:border-zinc-700">
        <form onSubmit={handleSubmit}>
          <textarea
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            placeholder="Add a note about this lead..."
            className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-zinc-800 dark:text-white resize-none"
            rows={3}
            disabled={isSubmitting}
          />
          {error && (
            <p className="text-sm text-red-600 dark:text-red-400 mt-1">
              {error}
            </p>
          )}
          <div className="mt-2 flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting || !newNote.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? "Saving..." : "Add Note"}
            </button>
          </div>
        </form>
      </div>

      {/* Notes List */}
      {notes.length === 0 ? (
        <div className="p-4 text-sm text-gray-500">No notes yet</div>
      ) : (
        <div className="divide-y divide-gray-100 dark:divide-zinc-800">
          {notes.map((note) => (
            <div key={note.id} className="p-4">
              <p className="text-sm text-gray-900 dark:text-zinc-300 whitespace-pre-wrap">
                {note.note}
              </p>
              <p className="text-xs text-gray-400 mt-2">
                {note.author} &middot; {formatDateTime(note.created_at)}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
