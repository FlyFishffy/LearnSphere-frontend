export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

export interface LoginUserVO {
  id: number;
  userName: string;
  roleType: number;
}

export interface LoginUserVO {
  id: number;
  userName: string;
  roleTypeDescription: string;
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
  tags: string;
  createTime: string;
  updateTime: string;
  content: string;
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
