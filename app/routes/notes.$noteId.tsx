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
  useActionData,
} from "@remix-run/react";
import invariant from "tiny-invariant";
import { useState, useEffect } from "react";

// Lazy load React Quill only on the client
const ReactQuill = typeof window !== "undefined" ? require("react-quill") : () => null;
import "react-quill/dist/quill.snow.css";

import { deleteNote, getNote, updateNote } from "~/models/note.server";
import { requireUserId } from "~/session.server";

type ActionData =
  | { errors: { title?: string; body?: string; server?: string }; success?: never }
  | { success: boolean; errors?: never }
  | { error: string; errors?: never; success?: never };

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
      return json<ActionData>({ errors: { title: "Title is required" } }, { status: 400 });
    }
    if (!body || body.length === 0) {
      return json<ActionData>({ errors: { body: "Body is required" } }, { status: 400 });
    }

    console.log("Action: Updating note with id:", params.noteId, "title:", title, "body:", body, "userId:", userId);

    try {
      await updateNote({ id: params.noteId, title, body, userId });
      return json<ActionData>({ success: true });
    } catch (error) {
      console.error("Action Error: Failed to update note:", error);
      return json<ActionData>(
        { errors: { server: "Failed to update note. Please try again." } },
        { status: 500 }
      );
    }
  }

  return json<ActionData>({ error: "Invalid intent" }, { status: 400 });
};

export default function NoteDetailsPage() {
  const params = useParams();
  const data = useLoaderData<typeof loader>();
  const actionData = useActionData<ActionData>();
  const navigation = useNavigation();
  const [isEditing, setIsEditing] = useState(false);
  const [bodyValue, setBodyValue] = useState(data.note.body);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const hasErrors = actionData && "errors" in actionData;

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      {isEditing ? (
        <Form
          method="post"
          onSubmit={(e) => {
            console.log("Form submitted with data:", new FormData(e.currentTarget));
          }}
          className="space-y-6 max-w-2xl bg-white p-6 rounded-lg shadow-md"
        >
          <input type="hidden" name="intent" value="update" />
          <div>
            <label htmlFor="title" className="block text-lg font-medium text-gray-700 mb-2">
              Title
              <input
                type="text"
                id="title"
                name="title"
                defaultValue={data.note.title}
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 p-2"
              />
            </label>
            {hasErrors && actionData.errors.title && (
              <p className="text-red-500 text-sm mt-1">{actionData.errors.title}</p>
            )}
          </div>
          <div>
            <label htmlFor="body" className="block text-lg font-medium text-gray-700 mb-2">
              Body
              {isClient ? (
                <ReactQuill
                  value={bodyValue}
                  onChange={setBodyValue}
                  theme="snow"
                  className="mt-1 block w-full rounded-md border-2 border-gray-300"
                  modules={{
                    toolbar: [
                      [{ header: [1, 2, false] }],
                      ["bold", "italic", "underline", "strike"],
                      [{ list: "ordered" }, { list: "bullet" }],
                      ["link", "image"],
                      ["clean"],
                    ],
                  }}
                />
              ) : (
                <textarea
                  name="body"
                  defaultValue={data.note.body}
                  rows={6}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 p-2"
                  onChange={(e) => setBodyValue(e.target.value)}
                />
              )}
              <input type="hidden" name="body" value={bodyValue} />
            </label>
            {hasErrors && actionData.errors.body && (
              <p className="text-red-500 text-sm mt-1">{actionData.errors.body}</p>
            )}
          </div>
          {hasErrors && actionData.errors.server && (
            <p className="text-red-500 text-sm">{actionData.errors.server}</p>
          )}
          <div className="flex space-x-4">
            <button
              type="submit"
              disabled={navigation.state === "submitting"}
              className="w-full py-3 px-6 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-300 disabled:bg-blue-400"
            >
              {navigation.state === "submitting" ? "Saving..." : "Save"}
            </button>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="w-full py-3 px-6 bg-gray-500 text-white rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition duration-300"
            >
              Cancel
            </button>
          </div>
        </Form>
      ) : (
        <>
          <h3 className="text-3xl font-bold mb-4 text-gray-800">{data.note.title}</h3>
          <div
            className="py-6 text-gray-700"
            dangerouslySetInnerHTML={{ __html: data.note.body }}
          />
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
                disabled={navigation.state === "submitting"}
                className="rounded bg-red-500 px-4 py-2 text-white hover:bg-red-600 focus:bg-red-400 disabled:bg-red-400"
              >
                {navigation.state === "submitting" ? "Deleting..." : "Delete"}
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