import { promises as fs } from 'fs';
import { join } from 'path';

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
    // Paths to JSON files (adjust based on your project structure)
    const booksPath = join(process.cwd(), 'app', 'bible_data', 'book.chapters.json');
    const kjvPath = join(process.cwd(), 'app', 'bible_data', 'kjv.json');

    // Read JSON files
    const booksContent = await fs.readFile(booksPath, 'utf8');
    const kjvContent = await fs.readFile(kjvPath, 'utf8');

    // Parse JSON for books
    const booksArray: BookChapter[] = JSON.parse(booksContent);
    const books = booksArray.reduce((acc: { [book: string]: number }, bookInfo: BookChapter) => {
      acc[bookInfo.book] = bookInfo.chapters;
      return acc;
    }, {});    // Should be { "Genesis": 50, "Exodus": 40, ... }

    // Parse JSON for KJV and transform to desired format
    const kjvArray: BookData[] = JSON.parse(kjvContent);
    const kjv: Record<string, Record<string, string>> = kjvArray.reduce((booksAcc, bookData) => { // Added type annotation here
      const chapters: Record<string, string> = bookData.chapters.reduce((chaptersAcc, chapterData) => { // Added type annotation here
        const versesText = chapterData.verses.map(verse => `${verse.verse}. ${verse.text}`).join('\n');
        chaptersAcc[chapterData.chapter] = versesText;
        return chaptersAcc;
      }, {} as Record<string, string>); // Added initial value type hint here
      booksAcc[bookData.book] = chapters;
      return booksAcc;
    }, {} as Record<string, Record<string, string>>);    // Should be { "Genesis": { "1": "text...", ... }, ... }


    return { books, kjv };
  } catch (error) {
    console.error('Error loading Bible data:', error);
    throw new Error('Failed to load Bible data');
  }
}