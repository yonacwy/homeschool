import { Link } from "@remix-run/react";

import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import {
  Form,
  isRouteErrorResponse,
  useParams,
  useLoaderData,
  useRouteError,
} from "@remix-run/react";
import invariant from "tiny-invariant";

import { deleteNote, getNote } from "~/models/note.server";
import { requireUserId } from "~/session.server";

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

  console.log('Action: Deleting note with id:', params.noteId, 'for user:', userId);

  try {
    await deleteNote({ id: params.noteId, userId });
    return redirect("/notes");
  } catch (error) {
    console.error('Error deleting note:', error);
    throw new Response("Failed to delete note", { status: 500 });
  }
};

export default function NoteDetailsPage() {
  const params = useParams();
  const data = useLoaderData<typeof loader>();

  return (
    <div className="p-6">
      <h3 className="text-3xl font-bold mb-4">{data.note.title}</h3>
      <p className="py-6">{data.note.body}</p>
      <hr className="my-4" />
      <div className="space-y-4">
        <Form method="post" onSubmit={(e) => {
          if (!confirm("Are you sure you want to delete this note?")) {
            e.preventDefault();
          }
        }}>
          <button
            type="submit"
            className="rounded bg-red-500 px-4 py-2 text-white hover:bg-red-600 focus:bg-red-400"
          >
            Delete
          </button>
        </Form>
        <Link to={`/notes/${params.noteId}/edit`} className="inline-block">
          <button
            type="button"
            className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 focus:bg-blue-400"
          >
            Edit
          </button>
        </Link>
      </div>
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