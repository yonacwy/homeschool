import { Link } from "@remix-run/react";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import {
  Form,
  isRouteErrorResponse,
  useParams,
  useLoaderData,
  useRouteError,
  useNavigation,
} from "@remix-run/react";
import invariant from "tiny-invariant";

import { deleteNote, getNote, updateNote } from "~/models/note.server";
import { requireUserId } from "~/session.server";
import { useState } from "react";

export const loader = async ({ params, request }: LoaderFunctionArgs) => {
  const userId = await requireUserId(request);
  invariant(params.noteId, "noteId not found");

  console.log('Loader: Fetching note with id:', params.noteId, 'for user:', userId);

  const note = await getNote({ id: params.noteId, userId });
  if (!note) {
    console.log('Note not found or unauthorized for user:', userId);
    throw new Response("Not Found", { status: 404 });
  }
  return json({ note });
};

export const action = async ({ params, request }: ActionFunctionArgs) => {
  const userId = await requireUserId(request);
  invariant(params.noteId, "noteId not found");

  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "delete") {
    console.log('Action: Deleting note with id:', params.noteId, 'for user:', userId);
    try {
      await deleteNote({ id: params.noteId, userId });
      return redirect("/notes");
    } catch (error) {
      console.error('Error deleting note:', error);
      throw new Response("Failed to delete note", { status: 500 });
    }
  } else if (intent === "update") {
    const title = formData.get("title") as string;
    const body = formData.get("body") as string;

    if (!title || title.length === 0) {
      return json({ errors: { title: "Title is required" } }, { status: 400 });
    }
    if (!body || body.length === 0) {
      return json({ errors: { body: "Body is required" } }, { status: 400 });
    }

    console.log("Action: Updating note with id:", params.noteId, "title:", title, "body:", body, "userId:", userId);

    try {
      await updateNote({ id: params.noteId, title, body, userId });
      return json({ success: true });
    } catch (error) {
      console.error("Action Error: Failed to update note:", error);
      return json(
        { errors: { server: "Failed to update note. Please try again." } },
        { status: 500 }
      );
    }
  }

  return json({ error: "Invalid intent" }, { status: 400 });
};

export default function NoteDetailsPage() {
  const params = useParams();
  const data = useLoaderData<typeof loader>();
  const navigation = useNavigation();
  const [isEditing, setIsEditing] = useState(false);

  return (
    <div className="p-6">
      {isEditing ? (
        <Form method="post" className="space-y-4">
          <input type="hidden" name="intent" value="update" />
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Title:
              <input
                type="text"
                name="title"
                defaultValue={data.note.title}
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              />
            </label>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Body:
              <textarea
                name="body"
                defaultValue={data.note.body}
                required
                rows={4}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              />
            </label>
          </div>
          <div className="flex space-x-4">
            <button
              type="submit"
              disabled={navigation.state === "submitting"}
              className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 focus:bg-blue-400"
            >
              {navigation.state === "submitting" ? "Saving..." : "Save"}
            </button>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="rounded bg-gray-500 px-4 py-2 text-white hover:bg-gray-600 focus:bg-gray-400"
            >
              Cancel
            </button>
          </div>
        </Form>
      ) : (
        <>
          <h3 className="text-3xl font-bold mb-4">{data.note.title}</h3>
          <p className="py-6">{data.note.body}</p>
          <hr className="my-4" />
          <div className="space-y-4">
            <Form method="post" onSubmit={(e) => {
              if (!confirm("Are you sure you want to delete this note?")) {
                e.preventDefault();
              }
            }}>
              <input type="hidden" name="intent" value="delete" />
              <button
                type="submit"
                className="rounded bg-red-500 px-4 py-2 text-white hover:bg-red-600 focus:bg-red-400"
              >
                Delete
              </button>
            </Form>
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 focus:bg-blue-400"
            >
              Edit
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export function ErrorBoundary() {
  const error = useRouteError();

  if (error instanceof Error) {
    return <div className="p-6 text-red-600">An unexpected error occurred: {error.message}</div>;
  }

  if (!isRouteErrorResponse(error)) {
    return <h1 className="p-6 text-red-600">Unknown Error</h1>;
  }

  if (error.status === 404) {
    return <div className="p-6 text-red-600">Note not found</div>;
  }

  return <div className="p-6 text-red-600">An unexpected error occurred: {error.statusText}</div>;
}