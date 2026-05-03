import { supabase } from "@/integrations/supabase/client";
import type {
  ApiClient,
  Photo,
  Comment,
  Task,
  UploadPhotoInput,
  AddCommentInput,
  AddTaskInput,
} from "./types";

export const cloudApi: ApiClient = {
  async listPhotos(category) {
    let q = supabase.from("photos").select("*").order("created_at", { ascending: false });
    if (category) q = q.eq("category", category);
    const { data, error } = await q;
    if (error) throw error;
    return (data ?? []) as Photo[];
  },

  async uploadPhoto({ file, city, caption, agent, uploaded_by, category }) {
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error: upErr } = await supabase.storage
      .from("photos")
      .upload(path, file, { contentType: file.type, upsert: false });
    if (upErr) throw upErr;

    const { data, error } = await supabase
      .from("photos")
      .insert({ city, caption, agent, file_path: path, uploaded_by, category: category ?? "field" })
      .select()
      .single();
    if (error) throw error;
    return data as Photo;
  },

  getPhotoUrl(file_path: string) {
    const { data } = supabase.storage.from("photos").getPublicUrl(file_path);
    return data.publicUrl;
  },

  async listComments(photoId: string) {
    const { data, error } = await supabase
      .from("comments")
      .select("*")
      .eq("photo_id", photoId)
      .order("created_at", { ascending: true });
    if (error) throw error;
    return (data ?? []) as Comment[];
  },

  async addComment(input: AddCommentInput) {
    const { error } = await supabase.from("comments").insert(input);
    if (error) throw error;
  },

  async listTasks() {
    const { data, error } = await supabase
      .from("additional_tasks")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as Task[];
  },

  async addTask(input: AddTaskInput) {
    const { error } = await supabase.from("additional_tasks").insert(input);
    if (error) throw error;
  },
};
