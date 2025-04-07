import { promises as fs } from 'fs';
import { join } from 'path';
import { prisma } from "~/db.server";

interface BookChapter {
  book: string;
  chapters: number;
}

interface Verse {
  verse: string;
  text: string;
}

interface ChapterData {
  chapter: string;
  verses: Verse[];
}

interface BookData {
  book: string;
  chapters: ChapterData[];
}

export async function getBibleData() {
  try {
    const booksPath = join(process.cwd(), 'app', 'bible_data', 'book.chapters.json');
    const kjvPath = join(process.cwd(), 'app', 'bible_data', 'kjv.json');

    const booksContent = await fs.readFile(booksPath, 'utf8');
    const kjvContent = await fs.readFile(kjvPath, 'utf8');

    const booksArray: BookChapter[] = JSON.parse(booksContent);
    const books = booksArray.reduce((acc: { [book: string]: number }, bookInfo: BookChapter) => {
      acc[bookInfo.book] = bookInfo.chapters;
      return acc;
    }, {});

    const kjvArray: BookData[] = JSON.parse(kjvContent);
    const kjv: Record<string, Record<string, string>> = kjvArray.reduce((booksAcc, bookData) => {
      const chapters: Record<string, string> = bookData.chapters.reduce((chaptersAcc, chapterData) => {
        const versesText = chapterData.verses.map(verse => `${verse.verse}. ${verse.text}`).join('\n');
        chaptersAcc[chapterData.chapter] = versesText;
        return chaptersAcc;
      }, {} as Record<string, string>);
      booksAcc[bookData.book] = chapters;
      return booksAcc;
    }, {} as Record<string, Record<string, string>>);

    return { books, kjv };
  } catch (error) {
    console.error('Error loading Bible data:', error);
    throw new Error('Failed to load Bible data');
  }
}

export async function recordBibleReading({ userId, book, chapter }: { userId: string; book: string; chapter: string }) {
  try {
    await prisma.bibleReading.create({
      data: {
        userId,
        book,
        chapter,
      },
    });
  } catch (error) {
    console.error('Error recording Bible reading:', error);
    throw new Error('Failed to record Bible reading');
  }
}