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
  courseTitle?: string;
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
  /** Source chunks attached to AI response (only for AI messages) */
  sources?: RetrievalChunkVO[];
}

export interface RetrievalChunkVO {
  text: string;
  heading?: string;
  source?: string;
  score?: number;
  chunkIndex?: number;
}

export interface ChatRequest {
  question: string;
  sessionId: string;
  courseId?: number;
}

export interface LlmFeedback {
  id?: number;
  teacherId?: number;
  courseId?: number;
  sessionId?: string;
  question: string;
  originalAnswer: string;
  correctedAnswer?: string;
  rating?: number;
  comment?: string;
  status?: number;
  createTime?: string;
  updateTime?: string;
}

export interface LlmFeedbackRequest {
  courseId?: number;
  sessionId?: string;
  question: string;
  originalAnswer: string;
  correctedAnswer?: string;
  rating?: number;
  comment?: string;
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

/* ---- Chat Evaluation (Feature #9) ---- */

export interface ChatEvaluation {
  id?: number;
  userId?: number;
  sessionId?: string;
  courseId?: number;
  question: string;
  aiAnswer: string;
  thumbs?: number; // 1=up, -1=down, 0=none
  rating?: number; // 1-5
  comment?: string;
  createTime?: string;
  updateTime?: string;
}

export interface ChatEvaluationRequest {
  sessionId: string;
  courseId?: number;
  question: string;
  aiAnswer: string;
  thumbs?: number;
  rating?: number;
  comment?: string;
}

export interface ChatEvaluationStats {
  totalCount?: number;
  thumbsUpCount?: number;
  thumbsDownCount?: number;
  averageRating?: number;
  satisfactionRate?: number;
  ratedCount?: number;
}

/* ---- Recommendation Performance (Feature #10) ---- */

export interface RecommendClickRequest {
  courseId: number;
  source: string; // "home" | "learning_center"
  recommendCount?: number;
  position?: number;
}

export interface RecommendStats {
  totalImpressions?: number;
  totalClicks?: number;
  clickThroughRate?: number;
  uniqueUsers?: number;
  clickedUsers?: number;
  userClickRate?: number;
  topClickedCourseId?: number;
  topClickedCourseTitle?: string;
  topClickedCount?: number;
}

export interface RecommendCourseClick {
  courseId: number;
  courseTitle?: string;
  clickCount: number;
}

