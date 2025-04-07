import type { LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Form, Link, NavLink, Outlet, useLoaderData } from "@remix-run/react";
import { requireUserId } from "~/session.server";
import { useUser } from "~/utils";
import { getBibleData, recordBibleReading } from "~/models/bible.server";
import React, { useState } from 'react';

// Define types for Bible data
interface BibleData {
  books: Record<string, number>; // Book name to number of chapters
  kjv: Record<string, Record<string, string>>; // Book to chapter to text
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const userId = await requireUserId(request);
  const bibleData = await getBibleData();
  const url = new URL(request.url);
  const selectedBook = url.searchParams.get("book") || Object.keys(bibleData.books)[0] || "Genesis";
  const selectedChapter = url.searchParams.get("chapter") || "1";
  return json({ userId, bibleData, selectedBook, selectedChapter });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const userId = await requireUserId(request);
  const formData = await request.formData();
  const book = formData.get("book") as string;
  const chapter = formData.get("chapter") as string;

  if (book && chapter) {
    await recordBibleReading({ userId, book, chapter });
  }

  return null; // No redirect needed; we stay on the page
};

export default function BiblePage() {
  const { userId, bibleData, selectedBook: initialBook, selectedChapter: initialChapter } = useLoaderData<typeof loader>();
  const user = useUser();
  const [selectedBook, setSelectedBook] = useState<string>(initialBook);
  const [selectedChapter, setSelectedChapter] = useState<string>(initialChapter);

  const books = Object.keys(bibleData.books) as string[];
  const chapters = Array.from({ length: bibleData.books[selectedBook] || 0 }, (_, i) => (i + 1).toString());

  const bibleText: string = bibleData.kjv[selectedBook]?.[selectedChapter] || "Select a book and chapter to view text.";

  // Split the text into paragraphs
  const paragraphs = bibleText.split('\n\n').map(paragraph => paragraph.trim()).filter(paragraph => paragraph.length > 0);

  return (
    <div className="flex h-full min-h-screen flex-col">
      <main className="flex-1 flex flex-col h-full bg-white" style={{ paddingTop: '64px' }}>
        <div className="fixed top-16 left-0 right-0 bg-white shadow-md z-30 p-4 border-b" style={{ zIndex: 30 }}>
          <Form method="post" className="flex flex-col md:flex-row gap-4 items-center justify-center">
            <select
              name="book"
              value={selectedBook}
              onChange={(e) => {
                setSelectedBook(e.target.value);
                e.target.form?.requestSubmit(); // Submit form on change
              }}
              className="w-full md:w-auto p-2 border rounded"
            >
              {books.map((book) => (
                <option key={book} value={book}>{book}</option>
              ))}
            </select>
            <select
              name="chapter"
              value={selectedChapter}
              onChange={(e) => {
                setSelectedChapter(e.target.value);
                e.target.form?.requestSubmit(); // Submit form on change
              }}
              className="w-full md:w-auto p-2 border rounded"
            >
              {chapters.map((chapter) => (
                <option key={chapter} value={chapter}>Chapter {chapter}</option>
              ))}
            </select>
          </Form>
        </div>
        <div className="flex-1 p-6" style={{ paddingTop: '120px' }}>
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