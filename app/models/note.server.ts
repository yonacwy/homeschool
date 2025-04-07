import type { User, Note } from "@prisma/client";

import { prisma } from "~/db.server";

export function getNote({
  id,
  userId,
}: Pick<Note, "id"> & {
  userId: User["id"];
}) {
  return prisma.note.findFirst({
    select: { id: true, body: true, title: true, userId: true },
    where: { id, userId },
  });
}

export function getNoteListItems({ userId }: { userId: User["id"] }) {
  return prisma.note.findMany({
    where: { userId },
    select: { id: true, title: true, updatedAt: true },
    orderBy: { updatedAt: "desc" },
  });
}

export function createNote({
  body,
  title,
  userId,
}: Pick<Note, "body" | "title"> & {
  userId: User["id"];
}) {
  return prisma.note.create({
    data: {
      title,
      body,
      userId, // Directly set userId instead of using connect for simplicity
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });
}

export function deleteNote({
  id,
  userId,
}: Pick<Note, "id"> & { userId: User["id"] }) {
  console.log("Attempting to delete note with id:", id, "for user:", userId);
  return prisma.note.delete({
    where: { id, userId }, // Changed to delete for single record
  }).catch((error) => {
    console.error("Error deleting note:", error);
    throw new Error("Failed to delete note: " + error.message);
  });
}

export function updateNote({
  id,
  title,
  body,
  userId,
}: Pick<Note, "id" | "title" | "body"> & { userId: User["id"] }) {
  console.log("Attempting to update note with id:", id, "for user:", userId, "title:", title, "body:", body);
  return prisma.note.update({
    where: { id, userId }, // Ensure user owns the note
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