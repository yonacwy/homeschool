import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Form, Link, NavLink, Outlet, useLoaderData } from "@remix-run/react";
import { requireUserId } from "~/session.server";
import { useUser } from "~/utils";
import { getBibleData } from "~/models/bible.server";
import React, { useState } from 'react';

// Define types for Bible data
interface BibleData {
  books: Record<string, number>; // Book name to number of chapters
  kjv: Record<string, Record<string, string>>; // Book to chapter to text
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const userId = await requireUserId(request);
  const bibleData = await getBibleData();
  return json({ userId, bibleData });
};

export default function BiblePage() {
  const { bibleData } = useLoaderData<typeof loader>();
  const user = useUser();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedBook, setSelectedBook] = useState<string>(Object.keys(bibleData.books)[0] || ""); // Default to first book, ensure string
  const [selectedChapter, setSelectedChapter] = useState<string>("1"); // Default to chapter 1, ensure string

  const books = Object.keys(bibleData.books) as string[];
  const chapters = Array.from({ length: bibleData.books[selectedBook] || 0 }, (_, i) => (i + 1).toString());

  const bibleText: string = bibleData.kjv[selectedBook]?.[selectedChapter] || "Select a book and chapter to view text.";

  return (
    <div className="flex h-full min-h-screen flex-col">
      {/* Main container with padding-top to account for header */}
      <main className="flex-1 flex flex-col md:flex-row-reverse h-full bg-white" style={{ paddingTop: '64px' }}>
        {/* Hamburger menu button for mobile only, positioned below header on the right, hides when sidebar is open */}
        {!isSidebarOpen && (
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="md:hidden fixed top-16 right-4 z-50 p-4 text-blue-500 focus:outline-none"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7" />
            </svg>
          </button>
        )}

        {/* Sidebar for Bible sections - hidden on mobile by default, fixed width on desktop, now on the right */}
        <div className={`
          fixed inset-y-0 right-0 transform ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full'}
          md:relative md:translate-x-0 md:flex md:w-80 md:border-l md:bg-gray-50 md:shadow
          transition-transform duration-300 ease-in-out z-40
          h-full
        `} style={{ top: '64px', boxShadow: '-2px 0 5px rgba(0, 0, 0, 0.1)' }}>
          <div className="h-full w-full overflow-y-auto p-4">
            {/* Book Selector */}
            <select 
              value={selectedBook} 
              onChange={(e) => setSelectedBook(e.target.value)} 
              className="w-full p-2 mb-4 border rounded"
            >
              {books.map((book) => (
                <option key={book} value={book}>{book}</option>
              ))}
            </select>

            {/* Chapter Selector */}
            <select 
              value={selectedChapter} 
              onChange={(e) => setSelectedChapter(e.target.value)} 
              className="w-full p-2 mb-4 border rounded"
            >
              {chapters.map((chapter) => (
                <option key={chapter} value={chapter}>Chapter {chapter}</option>
              ))}
            </select>
          </div>

          {/* Close button for mobile sidebar - now on the right when sidebar is open */}
          {isSidebarOpen && (
            <button 
              onClick={() => setIsSidebarOpen(false)}
              className="md:hidden absolute top-4 right-4 text-gray-500 hover:text-gray-800 focus:outline-none"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Overlay for mobile when sidebar is open - now covers left side */}
        {isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black opacity-50 md:hidden z-30"
            onClick={() => setIsSidebarOpen(false)}
          ></div>
        )}

        {/* Main content area - adjusts for sidebar width on desktop, now on the left, displays Bible text */}
        <div className="flex-1 p-6" style={{ marginRight: '320px', transition: 'margin-right 300ms ease-in-out' }}>
          <h1 className="text-2xl font-bold mb-4">{selectedBook} Chapter {selectedChapter}</h1>
          <div className="prose max-w-none">
            {bibleText.split('\n').map((line: string, index: number) => ( // Explicitly type line and index
              <p key={index}>{line}</p>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}