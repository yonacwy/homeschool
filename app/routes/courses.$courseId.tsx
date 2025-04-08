import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Form, useActionData, useLoaderData, useNavigation } from "@remix-run/react";
import { requireUserId } from "~/session.server";
import { getCourse, updateCourse, deleteCourse } from "~/models/course.server";
import React, { useState, useEffect } from 'react';

const ReactQuill = typeof window !== "undefined" ? require("react-quill") : () => null;
import "react-quill/dist/quill.snow.css";

export const loader = async ({ params, request }: LoaderFunctionArgs) => {
  const userId = await requireUserId(request);
  if (!params.courseId) {
    throw new Response("Course ID is required", { status: 400 });
  }

  const course = await getCourse({ id: params.courseId, userId });
  if (!course) {
    throw new Response("Course not found", { status: 404 });
  }

  return json({ course });
};

export const action = async ({ params, request }: ActionFunctionArgs) => {
  const userId = await requireUserId(request);
  if (!params.courseId) {
    return json({ error: "Course ID is required" }, { status: 400 });
  }

  const formData = await request.formData();
  const intent = formData.get("_intent");

  if (intent === "update") {
    const title = formData.get("title") as string;
    const description = formData.get("description") as string | null;
    const structure = formData.get("structure") as string;

    if (!title) {
      return json({ error: "Title is required" }, { status: 400 });
    }

    try {
      await updateCourse({
        id: params.courseId,
        title,
        description: description || "",
        structure,
        userId,
      });
      return redirect(`/courses/${params.courseId}`);
    } catch (error) {
      console.error('Error updating course:', error);
      return json({ error: "Failed to update course" }, { status: 500 });
    }
  } else if (intent === "delete") {
    try {
      await deleteCourse({ id: params.courseId, userId });
      return redirect("/courses");
    } catch (error) {
      console.error('Error deleting course:', error);
      return json({ error: "Failed to delete course" }, { status: 500 });
    }
  }

  return null;
};

type CourseItem = {
  id: string;
  content: string;
  type: 'topic' | 'lesson' | 'quiz';
  description?: string;
  lessonContent?: string;
  questions?: { question: string; answer: string }[];
};

export default function CoursePage() {
  const { course } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const [isEditing, setIsEditing] = useState(false);
  const [courseItems, setCourseItems] = useState<CourseItem[]>(
    course.structure ? JSON.parse(course.structure) : []
  );
  const [title, setTitle] = useState(course.title);
  const [description, setDescription] = useState(course.description || "");
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const updateItemContent = (id: string, field: 'content' | 'description' | 'lessonContent', value: string) => {
    setCourseItems(courseItems.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const addQuestion = (quizId: string) => {
    setCourseItems(courseItems.map(item => {
      if (item.id === quizId && item.type === 'quiz') {
        return {
          ...item,
          questions: [...(item.questions || []), { question: "New Question", answer: "" }],
        };
      }
      return item;
    }));
  };

  const updateQuestion = (quizId: string, questionIdx: number, field: 'question' | 'answer', value: string) => {
    setCourseItems(courseItems.map(item => {
      if (item.id === quizId && item.type === 'quiz' && item.questions) {
        const updatedQuestions = item.questions.map((q, idx) => 
          idx === questionIdx ? { ...q, [field]: value } : q
        );
        return { ...item, questions: updatedQuestions };
      }
      return item;
    }));
  };

  return (
    <div className="flex-1 p-6">
      <h1 className="text-2xl font-bold mb-4">Course: {course.title}</h1>
      {isEditing ? (
        <Form method="post" className="space-y-4 max-w-md">
          <input type="hidden" name="_intent" value="update" />
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700">
              Title
            </label>
            <input
              type="text"
              id="title"
              name="title"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            />
          </div>

          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-700 mb-4">Course Structure</h2>
            {courseItems.map((item) => (
              <div key={item.id} className="p-4 bg-gray-200 rounded shadow-md mb-2 space-y-2">
                <input
                  type="text"
                  value={item.content}
                  onChange={(e) => updateItemContent(item.id, 'content', e.target.value)}
                  className="w-full rounded-md border-gray-300 shadow-sm p-2 mb-2"
                  placeholder={`${item.type.charAt(0).toUpperCase() + item.type.slice(1)} Title`}
                />
                {item.type === 'topic' && (
                  <textarea
                    value={item.description || ""}
                    onChange={(e) => updateItemContent(item.id, 'description', e.target.value)}
                    className="w-full rounded-md border-gray-300 shadow-sm p-2"
                    placeholder="Topic Description"
                    rows={3}
                  />
                )}
                {item.type === 'lesson' && isClient && (
                  <ReactQuill
                    value={item.lessonContent || ""}
                    onChange={(value: string) => updateItemContent(item.id, 'lessonContent', value)} // Explicitly typed
                    theme="snow"
                    className="w-full rounded-md border-2 border-gray-300"
                    modules={{
                      toolbar: [
                        [{ header: [1, 2, false] }],
                        ["bold", "italic", "underline"],
                        [{ list: "ordered" }, { list: "bullet" }],
                        ["link"],
                        ["clean"],
                      ],
                    }}
                  />
                )}
                {item.type === 'quiz' && (
                  <div className="ml-4 space-y-2">
                    {item.questions?.map((q, qIdx) => (
                      <div key={qIdx} className="space-y-1">
                        <input
                          type="text"
                          value={q.question}
                          onChange={(e) => updateQuestion(item.id, qIdx, 'question', e.target.value)}
                          placeholder="Question"
                          className="w-full rounded-md border-gray-300 shadow-sm p-1"
                        />
                        <input
                          type="text"
                          value={q.answer}
                          onChange={(e) => updateQuestion(item.id, qIdx, 'answer', e.target.value)}
                          placeholder="Answer"
                          className="w-full rounded-md border-gray-300 shadow-sm p-1"
                        />
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => addQuestion(item.id)}
                      className="text-blue-500 hover:text-blue-700 text-sm"
                    >
                      Add Question
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          <input
            type="hidden"
            name="structure"
            value={JSON.stringify(courseItems)}
          />

          {actionData?.error && (
            <p className="text-red-500 text-sm">{actionData.error}</p>
          )}

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={navigation.state === "submitting"}
              className="py-2 px-4 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {navigation.state === "submitting" ? "Saving..." : "Save Changes"}
            </button>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="py-2 px-4 bg-gray-500 text-white rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              Cancel
            </button>
          </div>
        </Form>
      ) : (
        <div>
          <p className="text-gray-700 mb-4">{course.description}</p>
          <h2 className="text-xl font-semibold text-gray-700 mb-4">Course Structure</h2>
          {courseItems.length > 0 ? (
            courseItems.map((item) => (
              <div key={item.id} className="mb-4">
                <h3 className="text-lg font-medium text-gray-800">{item.content} ({item.type})</h3>
                {item.type === 'topic' && item.description && (
                  <p className="text-gray-600 ml-4">{item.description}</p>
                )}
                {item.type === 'lesson' && item.lessonContent && (
                  <div
                    className="text-gray-600 ml-4"
                    dangerouslySetInnerHTML={{ __html: item.lessonContent }}
                  />
                )}
                {item.type === 'quiz' && item.questions && (
                  <ul className="ml-4 list-disc">
                    {item.questions.map((q, qIdx) => (
                      <li key={qIdx}>
                        <strong>{q.question}</strong>: {q.answer}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))
          ) : (
            <p className="text-gray-600">No structure defined.</p>
          )}
          <div className="flex gap-4 mt-4">
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="py-2 px-4 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Edit Course
            </button>
            <Form method="post" onSubmit={(event) => {
              if (!confirm("Are you sure you want to delete this course?")) {
                event.preventDefault();
              }
            }}>
              <input type="hidden" name="_intent" value="delete" />
              <button
                type="submit"
                className="py-2 px-4 bg-red-500 text-white rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Delete Course
              </button>
            </Form>
          </div>
        </div>
      )}
    </div>
  );
}