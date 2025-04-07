import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Form, Link, NavLink, Outlet, useLoaderData } from "@remix-run/react";
import { getNoteListItems } from "~/models/note.server";
import { requireUserId } from "~/session.server";
import { useUser } from "~/utils";
import React, { useState } from 'react';

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const userId = await requireUserId(request);
  const noteListItems = await getNoteListItems({ userId });
  return json({ noteListItems });
};

export default function NotesPage() {
  const data = useLoaderData<typeof loader>();
  const user = useUser();

  return (
    <div className="flex h-full min-h-screen flex-col">
      {/* Main container with padding-top to account for header */}
      <main className="flex-1 flex flex-col h-full bg-white" style={{ paddingTop: '64px' }}>
        {/* Picker container fixed below header, ensuring it doesn't overlap nav drawer */}
        <div className="fixed top-16 left-0 right-0 bg-white shadow-md z-30 p-4 border-b" style={{ zIndex: 30 }}>
          <div className="flex flex-col md:flex-row gap-4 items-center justify-center">
            {/* Note List Dropdown (Picker) */}
            <select 
              className="w-full md:w-auto p-2 border rounded"
              onChange={(e) => {
                const noteId = e.target.value;
                if (noteId) {
                  window.location.href = `/notes/${noteId}`; // Navigate to the selected note
                }
              }}
            >
              <option value="">Select a Note</option>
              {data.noteListItems.map((note) => (
                <option key={note.id} value={note.id}>
                  📝 {note.title}
                </option>
              ))}
            </select>

            {/* New Note Link as a Button */}
            <Link to="new" className="w-full md:w-auto p-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-center">
              + New Note
            </Link>
          </div>
        </div>

        {/* Main content area - adjusts for picker height, displays notes */}
        <div className="flex-1 p-4 md:p-6" style={{ paddingTop: '120px' }}> {/* Increased padding to account for picker */}
          <Outlet />
        </div>
      </main>
    </div>
  );
}