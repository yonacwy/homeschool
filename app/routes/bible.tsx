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
  const [selectedBook, setSelectedBook] = useState<string>(Object.keys(bibleData.books)[0] || ""); // Default to first book
  const [selectedChapter, setSelectedChapter] = useState<string>("1"); // Default to chapter 1

  const books = Object.keys(bibleData.books) as string[];
  const chapters = Array.from({ length: bibleData.books[selectedBook] || 0 }, (_, i) => (i + 1).toString());

  const bibleText: string = bibleData.kjv[selectedBook]?.[selectedChapter] || "Select a book and chapter to view text.";

  // Split the text into paragraphs (assuming paragraphs are separated by double newlines `\n\n`)
  const paragraphs = bibleText.split('\n\n').map(paragraph => paragraph.trim()).filter(paragraph => paragraph.length > 0);

  return (
    <div className="flex h-full min-h-screen flex-col">
      {/* Main container with padding-top to account for header */}
      <main className="flex-1 flex flex-col h-full bg-white" style={{ paddingTop: '64px' }}>
        {/* Picker container fixed below header, ensuring it doesn't overlap nav drawer */}
        <div className="fixed top-16 left-0 right-0 bg-white shadow-md z-30 p-4 border-b" style={{ zIndex: 30 }}>
          <div className="flex flex-col md:flex-row gap-4 items-center justify-center">
            {/* Book Selector */}
            <select 
              value={selectedBook} 
              onChange={(e) => setSelectedBook(e.target.value)} 
              className="w-full md:w-auto p-2 border rounded"
            >
              {books.map((book) => (
                <option key={book} value={book}>{book}</option>
              ))}
            </select>

            {/* Chapter Selector */}
            <select 
              value={selectedChapter} 
              onChange={(e) => setSelectedChapter(e.target.value)} 
              className="w-full md:w-auto p-2 border rounded"
            >
              {chapters.map((chapter) => (
                <option key={chapter} value={chapter}>Chapter {chapter}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Main content area - adjusts for picker height, displays Bible text */}
        <div className="flex-1 p-6" style={{ paddingTop: '120px' }}> {/* Increased padding to account for picker */}
          <h1 className="text-2xl font-bold mb-4">{selectedBook} Chapter {selectedChapter}</h1>
          <div className="prose max-w-none">
            {paragraphs.length > 0 ? (
              paragraphs.map((paragraph, index) => (
                <p key={index} className="mb-4">{paragraph.split('\n').join(' ')}</p>
              ))
            ) : (
              <p>{bibleText}</p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}