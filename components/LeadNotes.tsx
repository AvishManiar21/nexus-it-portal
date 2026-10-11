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
    <div className="bg-white rounded-lg border border-line">
      <div className="p-4 border-b border-line">
        <h2 className="text-lg font-semibold text-ink">
          Internal Notes
        </h2>
      </div>

      {/* Note Entry Form */}
      <div className="p-4 border-b border-line">
        <form onSubmit={handleSubmit}>
          <textarea
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            placeholder="Add a note about this lead..."
            className="w-full px-3 py-2 border border-line rounded-md focus:outline-none focus:ring-2 focus:ring-brand resize-none"
            rows={3}
            disabled={isSubmitting}
          />
          {error && (
            <p className="text-sm text-red-600 mt-1">
              {error}
            </p>
          )}
          <div className="mt-2 flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting || !newNote.trim()}
              className="px-4 py-2 bg-brand text-white rounded-md hover:bg-brand-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? "Saving..." : "Add Note"}
            </button>
          </div>
        </form>
      </div>

      {/* Notes List */}
      {notes.length === 0 ? (
        <div className="p-4 text-sm text-muted">No notes yet</div>
      ) : (
        <div className="divide-y divide-line">
          {notes.map((note) => (
            <div key={note.id} className="p-4">
              <p className="text-sm text-ink whitespace-pre-wrap">
                {note.note}
              </p>
              <p className="text-xs text-muted mt-2">
                {note.author} &middot; {formatDateTime(note.created_at)}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
