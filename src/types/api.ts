export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

export interface LoginUserVO {
  id: number;
  userName: string;
  roleType: string;
  createTime?: string;
  updateTime?: string;
}


export interface UserRegisterDTO {
  userAccount: string;
  password: string;
  checkPassword: string;
}

export interface UserLoginDTO {
  userAccount: string;
  password: string;
}

export interface Course {
  id: number;
  title: string;
  description: string;
  coverUrl?: string;
  category?: string;
  tags?: string;
  contentMd?: string;
  uploadUserId?: number;
  status?: number;
  videoUrl?: string;
  videoDuration?: number;

  createTime?: string;
  updateTime?: string;
  isDeleted?: number;
}

export interface LearningRecord {
  id: number;
  userId: number;
  courseId: number;
  progressPercent?: number;
  scrollPosition?: number;
  contentLength?: number;
  totalStudySeconds?: number;
  lastLearningTime?: string;
  createTime?: string;
  updateTime?: string;
}

export interface LearningAnalysis {
  totalStudySeconds?: number;
  activeDaysLast30?: number;
  learningCourseCount?: number;
  topCategory?: string;
  topTag?: string;
}

export interface LearningReport {
  totalStudySeconds?: number;
  learningCourseCount?: number;
  favoriteCourseCount?: number;
  topCategory?: string;
  topTag?: string;
  lastLearningTime?: string;
}

export interface MessageVO {
  type: "AI" | "USER";
  text: string;
}

export interface ChatRequest {
  question: string;
  sessionId: string;
  courseId?: number;
}

export interface ChunkVO {
  id: number;
  courseId: number;
  chunkIndex: number;
  text: string;
  heading?: string;
  source?: string;
  createTime?: string;
}

export interface KnowledgeIndexStatusVO {
  courseId: number;
  courseTitle?: string;
  chunkCount: number;
  lastIndexTime?: string;
  indexed: boolean;
}

