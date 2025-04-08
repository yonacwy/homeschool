import type { User, Note } from "@prisma/client";
import { prisma } from "~/db.server";

export function getNote({
  id,
  userId,
}: Pick<Note, "id"> & { userId: User["id"] }) {
  return prisma.note.findFirst({
    select: { id: true, body: true, title: true },
    where: { id, userId },
  });
}

export function getNoteListItems({ userId }: { userId: User["id"] }) {
  return prisma.note.findMany({
    where: { userId },
    select: { id: true, title: true },
    orderBy: { updatedAt: "desc" },
  });
}

export function createNote({
  body,
  title,
  userId,
}: Pick<Note, "body" | "title"> & { userId: User["id"] }) {
  return prisma.note.create({
    data: {
      title,
      body,
      user: {
        connect: {
          id: userId,
        },
      },
    },
  });
}

export function deleteNote({
  id,
  userId,
}: Pick<Note, "id"> & { userId: User["id"] }) {
  console.log("Deleting note with id:", id, "for user:", userId);
  return prisma.note.deleteMany({
    where: { id, userId },
  });
}

export function updateNote({
  id,
  title,
  body,
  userId,
}: Pick<Note, "id" | "title" | "body"> & { userId: User["id"] }) {
  console.log("Updating note with id:", id, "title:", title, "body:", body, "userId:", userId);
  return prisma.note.update({
    where: { id }, // Revert to original working state
    data: {
      title,
      body,
      updatedAt: new Date(),
    },
  }).catch((error) => {
    console.error("Error updating note:", error);
    throw new Error("Failed to update note: " + error.message);
  });
}