export interface Photo {
  id: string;
  city: string;
  caption: string;
  agent: string;
  file_path: string;
  uploaded_by: string;
  created_at: string;
}

export interface Comment {
  id: string;
  photo_id: string;
  user_name: string;
  comment_text: string;
  created_at: string;
}

export interface Task {
  id: string;
  user_name: string;
  task_text: string;
  created_at: string;
}

export interface UploadPhotoInput {
  file: File;
  city: string;
  caption: string;
  agent: string;
  uploaded_by: string;
}

export interface AddCommentInput {
  photo_id: string;
  user_name: string;
  comment_text: string;
}

export interface AddTaskInput {
  user_name: string;
  task_text: string;
}

export interface ApiClient {
  listPhotos(): Promise<Photo[]>;
  uploadPhoto(input: UploadPhotoInput): Promise<Photo>;
  getPhotoUrl(file_path: string): string;
  listComments(photoId: string): Promise<Comment[]>;
  addComment(input: AddCommentInput): Promise<void>;
  listTasks(): Promise<Task[]>;
  addTask(input: AddTaskInput): Promise<void>;
}
