import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Form, useActionData, useLoaderData, useNavigate } from "@remix-run/react";
import invariant from "tiny-invariant";

import { updateNote, getNote } from "~/models/note.server";
import { requireUserId } from "~/session.server";

export const loader = async ({ params, request }: LoaderFunctionArgs) => {
  const userId = await requireUserId(request);
  invariant(params.noteId, "noteId not found");

  console.log('Loading note - noteId:', params.noteId, 'userId:', userId);

  const note = await getNote({ id: params.noteId, userId });
  if (!note) {
    throw new Response("Not Found", { status: 404 });
  }
  return json({ note });
};

export const action = async ({ params, request }: ActionFunctionArgs) => {
  const userId = await requireUserId(request);
  invariant(params.noteId, "noteId not found");
  invariant(typeof params.noteId === "string", "noteId must be a string");

  const formData = await request.formData();
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
    await updateNote({
      id: params.noteId,
      title,
      body,
      userId,
    });
    return redirect(`/notes/${params.noteId}`);
  } catch (error) {
    console.error("Action Error: Failed to update note:", error);
    return json(
      { errors: { server: "Failed to update note. Please try again." } },
      { status: 500 }
    );
  }
};

export default function NoteEditPage() {
  const { note } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigate = useNavigate();

  console.log("Rendering NoteEditPage with note:", note);

  return (
    <div className="flex-1 p-6 bg-gray-100 min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Edit Note</h1>
      {actionData?.errors && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg">
          {Object.entries(actionData.errors).map(([key, value]) => (
            <p key={key}>{value}</p>
          ))}
        </div>
      )}
      <Form method="post" onSubmit={(e) => {
        console.log("Form submitted with data:", new FormData(e.currentTarget));
      }} className="space-y-6 max-w-2xl bg-white p-6 rounded-lg shadow-md">
        <div>
          <label htmlFor="title" className="block text-lg font-medium text-gray-700 mb-2">
            Title
          </label>
          <input
            type="text"
            id="title"
            name="title"
            defaultValue={note.title}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 p-2"
          />
        </div>

        <div>
          <label htmlFor="body" className="block text-lg font-medium text-gray-700 mb-2">
            Body
          </label>
          <textarea
            id="body"
            name="body"
            defaultValue={note.body}
            required
            rows={6}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 p-2"
          />
        </div>

        <div className="flex space-x-4">
          <button
            type="submit"
            className="w-full py-3 px-6 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-300"
          >
            Update Note
          </button>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="w-full py-3 px-6 bg-gray-500 text-white rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition duration-300"
          >
            Cancel
          </button>
        </div>
      </Form>
    </div>
  );
}