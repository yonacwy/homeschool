import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Form, useActionData, useNavigation } from "@remix-run/react";
import { requireUserId } from "~/session.server";
import { createCourse } from "~/models/course.server";
import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

const ReactQuill = typeof window !== "undefined" ? require("react-quill") : () => null;
import "react-quill/dist/quill.snow.css";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await requireUserId(request);
  return json({});
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const userId = await requireUserId(request);
  const formData = await request.formData();
  const title = formData.get("title") as string;
  const description = formData.get("description") as string | null;
  const structure = formData.get("structure") as string;

  console.log('Received form data:', { title, description, structure });

  if (!title) {
    return json({ error: "Title is required" }, { status: 400 });
  }

  try {
    const course = await createCourse({
      title,
      description: description || "",
      userId,
      structure: structure || null,
    });
    console.log('Course created successfully:', course);
    return redirect("/courses");
  } catch (error) {
    console.error('Action error:', error);
    return json({ error: (error as Error).message || "Failed to create course" }, { status: 500 });
  }
};

type CourseItem = {
  id: string;
  content: string;
  type: 'topic' | 'lesson' | 'quiz';
  description?: string;
  lessonContent?: string;
  questions?: { question: string; answer: string }[];
};

export default function NewCoursePage() {
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const [courseTitle, setCourseTitle] = useState('');
  const [courseDescription, setCourseDescription] = useState('');
  const [courseItems, setCourseItems] = useState<CourseItem[]>([]);
  const [points, setPoints] = useState(0);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const addItem = (type: CourseItem['type']) => {
    const newItem: CourseItem = {
      id: `item-${Date.now()}`,
      content: `New ${type.charAt(0).toUpperCase() + type.slice(1)}`,
      type,
      ...(type === 'topic' && { description: "" }),
      ...(type === 'lesson' && { lessonContent: "" }),
      ...(type === 'quiz' && { questions: [] }),
    };
    setCourseItems([...courseItems, newItem]);
    setPoints(points + 10);
  };

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
    setPoints(points + 5);
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

  const onDragEnd = (result: any) => {
    if (!result.destination) return;

    const newItems = Array.from(courseItems);
    const [reorderedItem] = newItems.splice(result.source.index, 1);
    newItems.splice(result.destination.index, 0, reorderedItem);

    setCourseItems(newItems);
    setPoints(points + 5);
  };

  return (
    <div className="flex-1 p-6 bg-gray-100 min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Create New Course</h1>
      <Form method="post" className="space-y-6 max-w-2xl bg-white p-6 rounded-lg shadow-md">
        <div>
          <label htmlFor="title" className="block text-lg font-medium text-gray-700 mb-2">
            Course Title
          </label>
          <input
            type="text"
            id="title"
            name="title"
            required
            value={courseTitle}
            onChange={(e) => setCourseTitle(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 p-2"
            placeholder="Enter course title"
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-lg font-medium text-gray-700 mb-2">
            Description (Optional)
          </label>
          <textarea
            id="description"
            name="description"
            rows={4}
            value={courseDescription}
            onChange={(e) => setCourseDescription(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 p-2"
            placeholder="Enter course description"
          />
        </div>

        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">Course Structure</h2>
          <div className="space-x-4 mb-4">
            <button
              type="button"
              onClick={() => addItem('topic')}
              className="bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600"
            >
              Add Topic
            </button>
            <button
              type="button"
              onClick={() => addItem('lesson')}
              className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
            >
              Add Lesson
            </button>
            <button
              type="button"
              onClick={() => addItem('quiz')}
              className="bg-purple-500 text-white py-2 px-4 rounded hover:bg-purple-600"
            >
              Add Quiz
            </button>
          </div>

          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="droppable">
              {(provided) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className="mt-4 space-y-4"
                >
                  {courseItems.map((item, index) => (
                    <Draggable key={item.id} draggableId={item.id} index={index}>
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className="p-4 bg-gray-200 rounded shadow-md space-y-2"
                        >
                          <div className="flex justify-between items-center">
                            <input
                              type="text"
                              value={item.content}
                              onChange={(e) => updateItemContent(item.id, 'content', e.target.value)}
                              className="flex-1 mr-2 rounded-md border-gray-300 shadow-sm p-2"
                              placeholder={`${item.type.charAt(0).toUpperCase() + item.type.slice(1)} Title`}
                            />
                            <button
                              type="button"
                              onClick={() => setCourseItems(courseItems.filter(i => i.id !== item.id))}
                              className="text-red-500 hover:text-red-700"
                            >
                              Remove
                            </button>
                          </div>
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
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </div>

        <input
          type="hidden"
          name="structure"
          value={JSON.stringify(courseItems)}
        />

        <div className="mt-6 p-4 bg-yellow-100 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-800">Your Progress</h3>
          <p className="text-gray-700">Points: {points}</p>
          {points >= 50 && <span className="text-green-600">Badge Unlocked: Course Creator!</span>}
        </div>

        {actionData?.error && (
          <p className="text-red-500 text-sm">{actionData.error}</p>
        )}

        <button
          type="submit"
          disabled={navigation.state === "submitting"}
          className="w-full py-3 px-6 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-300"
        >
          {navigation.state === "submitting" ? "Creating..." : "Create Course"}
        </button>
      </Form>
    </div>
  );
}