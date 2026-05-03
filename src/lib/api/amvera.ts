/**
 * Будущий адаптер для вашего Express+PostgreSQL бэкенда на Amvera.
 * Эндпоинты совпадают с server.js. Включается через VITE_API_BACKEND=amvera
 * и VITE_API_BASE=https://your-app.amvera.io
 */
import type {
  ApiClient,
  Photo,
  Comment,
  Task,
  UploadPhotoInput,
  AddCommentInput,
  AddTaskInput,
} from "./types";

const BASE = (import.meta.env.VITE_API_BASE as string | undefined) ?? "";

async function j<T>(res: Response): Promise<T> {
  if (!res.ok) throw new Error(`API ${res.status}: ${await res.text()}`);
  return res.json() as Promise<T>;
}

export const amveraApi: ApiClient = {
  async listPhotos(category) {
    const url = category ? `${BASE}/get-photos?category=${category}` : `${BASE}/get-photos`;
    return j<Photo[]>(await fetch(url));
  },

  async uploadPhoto({ file, city, caption, agent, uploaded_by, category, media_type }) {
    const mt = media_type ?? (file.type.startsWith("video/") ? "video" : "image");
    const fd = new FormData();
    fd.append("photo", file);
    fd.append("city", city);
    fd.append("caption", caption);
    fd.append("agent", agent);
    fd.append("uploaded_by", uploaded_by);
    fd.append("category", category ?? "field");
    fd.append("media_type", mt);
    const res = await fetch(`${BASE}/upload-photo`, { method: "POST", body: fd });
    if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
    return {
      id: crypto.randomUUID(),
      city,
      caption,
      agent,
      file_path: file.name,
      uploaded_by,
      created_at: new Date().toISOString(),
      category: category ?? "field",
      media_type: mt,
    };
  },

  getPhotoUrl(file_path: string) {
    return `${BASE}/uploads/${file_path}`;
  },

  async listComments(photoId: string) {
    return j<Comment[]>(await fetch(`${BASE}/get-comments/${photoId}`));
  },

  async addComment(input: AddCommentInput) {
    const res = await fetch(`${BASE}/add-comment`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!res.ok) throw new Error(`Add comment failed: ${res.status}`);
  },

  async listTasks() {
    return j<Task[]>(await fetch(`${BASE}/get-additional-tasks`));
  },

  async addTask(input: AddTaskInput) {
    const res = await fetch(`${BASE}/send-additional-task`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!res.ok) throw new Error(`Add task failed: ${res.status}`);
  },
};
