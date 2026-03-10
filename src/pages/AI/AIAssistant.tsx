import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Card,
  Input,
  Button,
  Spin,
  message as antdMessage,
  Tooltip,
  Select,
  Modal,
  Rate,
  Tag,
  Collapse,
} from "antd";

import {
  PlusOutlined,
  MessageOutlined,
  CopyOutlined,
  EditOutlined,
  StarOutlined,
  FileTextOutlined,
  LikeOutlined,
  LikeFilled,
  DislikeOutlined,
  DislikeFilled,
} from "@ant-design/icons";
import Header from "../../components/Header";
import request from "../../api/request";
import type {
  ApiResponse,
  MessageVO,
  ChatRequest,
  Course,
  RetrievalChunkVO,
  LlmFeedbackRequest,
  ChatEvaluationRequest,
} from "../../types/api";

import { useAuth } from "../../hooks/useAuth";
import "./AIAssistant.css";
import "katex/dist/katex.min.css";
import ReactMarkdown from "react-markdown";
import type { Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";

/**
 * 注意：
 * - 该文件为“ChatGPT UI 增强版”的完整实现（无 any，类型严格）。
 * - 需要项目中存在 types: ApiResponse, MessageVO, ChatRequest（你原有的 types/api）。
 * - 需要安装依赖：
 *     npm install react-markdown remark-gfm react-syntax-highlighter
 *
 * 如果你的 tsconfig.json 使用 "jsx": "react-jsx"（React 17+ 自动导入），
 * 也可以移除 `import React`，但这里保留 import React 以提升兼容性。
 */

/* ---- helpers ---- */

const createSessionId = (): string =>
  // 使用 crypto.randomUUID 如果可用，否则回退到时间戳+随机字符串
  typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

/** 生成会话标题（从第一条用户消息） */
const generateSessionTitle = (text: string): string => {
  const normalized = text.trim().replace(/\s+/g, " ");
  if (!normalized) return "新的对话";
  return normalized.length > 20 ? normalized.slice(0, 20) + "..." : normalized;
};

/* ---- Component ---- */

export default function AIAssistant(): React.JSX.Element {
  const { user } = useAuth();

  const [question, setQuestion] = useState<string>("");
  const [messages, setMessages] = useState<MessageVO[]>([]);
  const [sessions, setSessions] = useState<string[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingSessions, setLoadingSessions] = useState<boolean>(false);
  const [loadingHistory, setLoadingHistory] = useState<boolean>(false);

  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<number | undefined>();


  // 会话 ID -> 标题
  const [sessionTitles, setSessionTitles] = useState<Record<string, string>>(
    {}
  );

  // 当前流式中的文本（单独一个"打字气泡"，不进 messages）
  const [streamingText, setStreamingText] = useState<string | null>(null);

  // Current streaming sources (received before answer tokens)
  const [streamingSources, setStreamingSources] = useState<RetrievalChunkVO[]>([]);

  // Teacher feedback modal state
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const [feedbackTarget, setFeedbackTarget] = useState<{
    question: string;
    answer: string;
  } | null>(null);
  const [feedbackRating, setFeedbackRating] = useState<number>(0);
  const [feedbackComment, setFeedbackComment] = useState<string>("");
  const [feedbackCorrectedAnswer, setFeedbackCorrectedAnswer] = useState<string>("");
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);

  // 滚动容器 ref
  const chatWindowRef = useRef<HTMLDivElement | null>(null);

  // 用于临时合并流式文本，减少频繁 setState
  const streamingBufferRef = useRef<string>("");

  // User evaluation state: message index -> thumbs value (1=up, -1=down)
  const [evaluations, setEvaluations] = useState<Record<number, number>>({});
  // User star rating state: message index -> rating (1-5)
  const [ratings, setRatings] = useState<Record<number, number>>({});
  // Track which messages are currently submitting evaluation
  const [evaluatingIdx, setEvaluatingIdx] = useState<Set<number>>(new Set());

  /* ---- 加载课程列表 ---- */

  const loadCourses = useCallback(async (): Promise<void> => {
    try {
      const res = await request.get<ApiResponse<Course[]>>("/course/list");
      if (res.data.code === 200) {
        setCourses(res.data.data || []);
      }
    } catch (error) {
      console.error("加载课程列表失败：", error);
    }
  }, []);

  /* ---- 加载会话列表 ---- */


  const loadSessions = useCallback(async (): Promise<void> => {
    if (!user) return;
    setLoadingSessions(true);
    try {
      const res = await request.get<ApiResponse<string[]>>("/ai/get/session");
      if (res.data.code === 200) {
        const sessionList = res.data.data || [];
        setSessions(sessionList);

        // Batch fetch all session titles
        if (sessionList.length > 0) {
          try {
            const titlesRes = await request.get<
              ApiResponse<Record<string, string>>
            >("/ai/get/session/titles");
            if (titlesRes.data.code === 200 && titlesRes.data.data) {
              setSessionTitles((prev) => ({
                ...prev,
                ...titlesRes.data.data,
              }));
            }
          } catch (err) {
            console.warn("Failed to load session titles:", err);
          }
        }
      }
    } catch (error) {
      console.error("加载会话列表失败：", error);
    } finally {
      setLoadingSessions(false);
    }
  }, [user]);

  /* ---- 加载会话历史 ---- */

  const loadSessionHistory = useCallback(
    async (sessionId: string): Promise<void> => {
      setLoadingHistory(true);
      try {
        const res = await request.get<ApiResponse<MessageVO[]>>(
          `/ai/get/session/${sessionId}`
        );
        if (res.data.code === 200) {
          const history = res.data.data || [];
          setMessages(history);
          setCurrentSessionId(sessionId);

          const firstUserMsg = history.find((m) => m.type === "USER");
          if (firstUserMsg?.text) {
            const title = generateSessionTitle(firstUserMsg.text);
            setSessionTitles((prev) => ({
              ...prev,
              [sessionId]: title,
            }));
          }
        }
      } catch (error) {
        antdMessage.error("加载历史消息失败");
        console.error("加载历史消息失败：", error);
      } finally {
        setLoadingHistory(false);
      }
    },
    []
  );

  /* ---- 新会话 ---- */

  const startNewConversation = useCallback((): void => {
    const newSessionId = createSessionId();
    setCurrentSessionId(newSessionId);
    setMessages([]);
    setQuestion("");
    setStreamingText(null);
    antdMessage.success("已开始新的对话");
  }, []);

  /* ---- 自动滚动（当 messages 或 streamingText 更新时） ---- */

  useEffect(() => {
    const el = chatWindowRef.current;
    if (!el) return;
    // 使用 requestAnimationFrame 以保证渲染完成后滚动
    requestAnimationFrame(() => {
      el.scrollTop = el.scrollHeight;
    });
  }, [messages, streamingText]);

  /* ---- 复制到剪贴板 ---- */

  const copyToClipboard = useCallback(async (text: string): Promise<void> => {
    try {
      await navigator.clipboard.writeText(text);
      antdMessage.success("已复制到剪贴板");
    } catch (err) {
      console.log(err);
      antdMessage.error("复制失败");
    }
  }, []);

  /* ---- Teacher Feedback ---- */

  const userRole = user?.roleType?.toLowerCase?.() || "";
  const isTeacher = userRole === "teacher" || userRole === "admin";

  // Debug: log user role info (can remove after verification)
  useEffect(() => {
    if (user) {
      console.log("[AIAssistant] user:", user, "roleType:", user.roleType, "isTeacher:", userRole === "teacher" || userRole === "admin");
    }
  }, [user, userRole]);

  const openFeedbackModal = useCallback(
    (question: string, answer: string) => {
      setFeedbackTarget({ question, answer });
      setFeedbackRating(0);
      setFeedbackComment("");
      setFeedbackCorrectedAnswer("");
      setFeedbackModalOpen(true);
    },
    []
  );

  const submitFeedback = useCallback(async (): Promise<void> => {
    if (!feedbackTarget) return;
    if (feedbackRating === 0 && !feedbackCorrectedAnswer.trim() && !feedbackComment.trim()) {
      antdMessage.warning("请至少提供评分、修正答案或评论中的一项");
      return;
    }
    setFeedbackSubmitting(true);
    try {
      const reqBody: LlmFeedbackRequest = {
        courseId: selectedCourseId,
        sessionId: currentSessionId || undefined,
        question: feedbackTarget.question,
        originalAnswer: feedbackTarget.answer,
        correctedAnswer: feedbackCorrectedAnswer.trim() || undefined,
        rating: feedbackRating || undefined,
        comment: feedbackComment.trim() || undefined,
      };
      const res = await request.post<ApiResponse<unknown>>("/feedback/submit", reqBody);
      if (res.data.code === 200) {
        antdMessage.success("反馈提交成功");
        setFeedbackModalOpen(false);
      } else {
        antdMessage.error(res.data.message || "提交失败");
      }
    } catch (error) {
      antdMessage.error("提交反馈失败");
      console.error(error);
    } finally {
      setFeedbackSubmitting(false);
    }
  }, [feedbackTarget, feedbackRating, feedbackCorrectedAnswer, feedbackComment, selectedCourseId, currentSessionId]);

  /* ---- User Evaluation (thumbs up/down + star rating) ---- */

  const submitEvaluation = useCallback(
    async (msgIndex: number, thumbs: 1 | -1): Promise<void> => {
      if (!currentSessionId) return;
      const aiMsg = messages[msgIndex];
      if (!aiMsg || aiMsg.type !== "AI") return;

      // Find preceding user message
      const prevUserMsg = messages
        .slice(0, msgIndex)
        .reverse()
        .find((m) => m.type === "USER");

      // If already the same thumbs, toggle off (remove evaluation)
      const currentThumbs = evaluations[msgIndex];
      if (currentThumbs === thumbs) {
        setEvaluations((prev) => {
          const next = { ...prev };
          delete next[msgIndex];
          return next;
        });
        return;
      }

      setEvaluatingIdx((prev) => new Set(prev).add(msgIndex));
      try {
        const reqBody: ChatEvaluationRequest = {
          sessionId: currentSessionId,
          courseId: selectedCourseId,
          question: prevUserMsg?.text || "",
          aiAnswer: aiMsg.text,
          thumbs,
        };
        const res = await request.post<ApiResponse<unknown>>(
          "/evaluation/submit",
          reqBody
        );
        if (res.data.code === 200) {
          setEvaluations((prev) => ({ ...prev, [msgIndex]: thumbs }));
          antdMessage.success(thumbs === 1 ? "已点赞 👍" : "已点踩 👎");
        } else {
          antdMessage.error(res.data.message || "评价提交失败");
        }
      } catch (error) {
        antdMessage.error("评价提交失败");
        console.error(error);
      } finally {
        setEvaluatingIdx((prev) => {
          const next = new Set(prev);
          next.delete(msgIndex);
          return next;
        });
      }
    },
    [currentSessionId, messages, selectedCourseId, evaluations]
  );

  /** Submit star rating for an AI message */
  const submitRating = useCallback(
    async (msgIndex: number, ratingValue: number): Promise<void> => {
      if (!currentSessionId) return;
      const aiMsg = messages[msgIndex];
      if (!aiMsg || aiMsg.type !== "AI") return;

      const prevUserMsg = messages
        .slice(0, msgIndex)
        .reverse()
        .find((m) => m.type === "USER");

      setEvaluatingIdx((prev) => new Set(prev).add(msgIndex));
      try {
        const reqBody: ChatEvaluationRequest = {
          sessionId: currentSessionId,
          courseId: selectedCourseId,
          question: prevUserMsg?.text || "",
          aiAnswer: aiMsg.text,
          rating: ratingValue,
        };
        const res = await request.post<ApiResponse<unknown>>(
          "/evaluation/submit",
          reqBody
        );
        if (res.data.code === 200) {
          setRatings((prev) => ({ ...prev, [msgIndex]: ratingValue }));
          antdMessage.success(`已评分 ${ratingValue} 星 ⭐`);
        } else {
          antdMessage.error(res.data.message || "评分提交失败");
        }
      } catch (error) {
        antdMessage.error("评分提交失败");
        console.error(error);
      } finally {
        setEvaluatingIdx((prev) => {
          const next = new Set(prev);
          next.delete(msgIndex);
          return next;
        });
      }
    },
    [currentSessionId, messages, selectedCourseId]
  );

  /* ---- ReactMarkdown 组件的类型化（无 any） ---- */

  // 使用 react-markdown 的 Components 类型来为自定义组件建立类型
  type CodeComponentProps = React.DetailedHTMLProps<
    React.HTMLAttributes<HTMLElement>,
    HTMLElement
  > & { inline?: boolean; className?: string; children?: React.ReactNode };
  type TableComponentProps = React.DetailedHTMLProps<
    React.TableHTMLAttributes<HTMLTableElement>,
    HTMLTableElement
  > & { children?: React.ReactNode };

  const MarkdownComponents: Components = {
    code: (props: CodeComponentProps) => {
      const { inline, className, children } = props;
      const value = String(children).replace(/\n$/, "");
      const match = /language-(\w+)/.exec(className || "");
      const language = match ? match[1] : "";

      if (inline) {
        return (
          <code className={className} {...props}>
            {children}
          </code>
        );
      }

      return (
        <div
          className="code-block-wrapper"
          role="group"
          aria-label="code block"
        >
          <div className="code-block-toolbar">
            <span className="lang-label">{language || "text"}</span>
            <Tooltip title="复制">
              <Button
                type="text"
                icon={<CopyOutlined />}
                onClick={() => copyToClipboard(value)}
                size="small"
              />
            </Tooltip>
          </div>
          <SyntaxHighlighter
            style={vscDarkPlus}
            language={language}
            PreTag="div"
            customStyle={{ margin: 0, padding: "1rem", borderRadius: 8 }}
          >
            {value}
          </SyntaxHighlighter>
        </div>
      );
    },

    table: (props: TableComponentProps) => {
      return <table className="markdown-table">{props.children}</table>;
    },
  };

  /* ---- Source Citation Component ---- */

  const SourceCitation: React.FC<{ sources: RetrievalChunkVO[] }> = ({ sources }) => {
    if (!sources || sources.length === 0) return null;
    return (
      <Collapse
        className="source-citation-collapse"
        size="small"
        items={[
          {
            key: "sources",
            label: (
              <span className="source-citation-label">
                <FileTextOutlined /> 参考来源 ({sources.length})
              </span>
            ),
            children: (
              <div className="source-citation-list">
                {sources.map((src, idx) => (
                  <div key={idx} className="source-citation-item">
                    <div className="source-citation-header">
                      <Tag color="blue">[来源{idx + 1}]</Tag>
                      {src.heading && (
                        <span className="source-heading">{src.heading}</span>
                      )}
                      {src.source && (
                        <Tag color="geekblue">{src.source}</Tag>
                      )}
                      {src.score != null && (
                        <Tag color={src.score > 0.7 ? "green" : src.score > 0.4 ? "orange" : "red"}>
                          相关性: {(src.score * 100).toFixed(1)}%
                        </Tag>
                      )}
                    </div>
                    <div className="source-citation-text">
                      {src.text.length > 200
                        ? src.text.substring(0, 200) + "..."
                        : src.text}
                    </div>
                  </div>
                ))}
              </div>
            ),
          },
        ]}
      />
    );
  };

  /* ---- SSE 流式请求（稳健解析） ---- */

  const askAI = useCallback(async (): Promise<void> => {
    const trimmed = question.trim();
    if (!trimmed) {
      antdMessage.warning("请输入问题");
      return;
    }

    const sessionId = currentSessionId || createSessionId();
    if (!currentSessionId) {
      setCurrentSessionId(sessionId);
    }

    setSessionTitles((prev) => ({
      ...prev,
      [sessionId]: prev[sessionId] || generateSessionTitle(trimmed),
    }));

    const userMessage: MessageVO = {
      type: "USER",
      text: trimmed,
    };
    setMessages((prev) => [...prev, userMessage]);
    setQuestion("");
    setLoading(true);
    setStreamingText(""); // 开始显示流式气泡
    setStreamingSources([]); // reset sources
    streamingBufferRef.current = "";

    try {
      const chatRequest: ChatRequest = {
        question: trimmed,
        sessionId: sessionId,
        courseId: selectedCourseId,
      };


      const response = await fetch("/api/ai/ask", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(chatRequest),
        credentials: "include",
      });

      if (!response.ok || !response.body) {
        throw new Error("网络请求失败");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");

      let aiText = "";
      let buffer = "";
      let done = false;
      let parsedSources: RetrievalChunkVO[] = [];

      // Parse SSE: handle "sources" event and normal data events
      while (!done) {
        const { value, done: streamDone } = await reader.read();
        if (streamDone) break;

        buffer += decoder.decode(value, { stream: true });

        // SSE events separated by \n\n
        const events = buffer.split("\n\n");
        buffer = events.pop() || "";

        for (const rawEvent of events) {
          const lines = rawEvent.split("\n");
          let eventName = "";
          let eventData = "";

          for (const line of lines) {
            if (line.startsWith("event:")) {
              eventName = line.slice("event:".length).trim();
            } else if (line.startsWith("data:")) {
              eventData = line.slice("data:".length);
            }
          }

          // Handle sources event
          if (eventName === "sources" && eventData) {
            try {
              parsedSources = JSON.parse(eventData) as RetrievalChunkVO[];
              setStreamingSources(parsedSources);
            } catch (e) {
              console.warn("Failed to parse sources SSE:", e);
            }
            continue;
          }

          // Handle done event
          if (eventName === "done" || eventData === "[DONE]" || eventData === "[DONE]\r") {
            done = true;
            break;
          }

          // Handle error event
          if (eventName === "error") {
            console.error("SSE error:", eventData);
            done = true;
            break;
          }

          // Normal data: streaming text tokens
          if (eventData !== undefined && eventName === "") {
            const piece = eventData === "" ? "\n" : eventData;
            aiText += piece;
            streamingBufferRef.current = aiText;
            setStreamingText(streamingBufferRef.current);
          }
        }
        if (done) break;
      }

      // Stream ended: clear streaming bubble and write full AI message
      setStreamingText(null);

      if (aiText) {
        setMessages((prev) => [
          ...prev,
          {
            type: "AI",
            text: aiText,
            sources: parsedSources.length > 0 ? parsedSources : undefined,
          },
        ]);
      }
      setStreamingSources([]);

      // 如果是新会话，刷新会话列表
      if (!sessions.includes(sessionId)) {
        await loadSessions();
      }
    } catch (error) {
      antdMessage.error("获取回答失败，请稍后再试");
      console.error("获取回答失败：", error);
      setStreamingText(null);
      // 移除最后一条用户消息（失败回滚）
      setMessages((prev) => {
        if (prev.length >= 1) {
          return prev.slice(0, -1);
        }
        return prev;
      });
    } finally {
      setLoading(false);
    }
  }, [question, currentSessionId, loadSessions, selectedCourseId, sessions]);


  /* ---- 组件挂载时加载会话列表 ---- */

  useEffect(() => {
    if (user) {
      loadSessions();
    }
  }, [loadSessions, user]);

  useEffect(() => {
    loadCourses();
  }, [loadCourses]);


  /* ---- JSX 输出 ---- */

  return (
    <div className="ai-wrapper chatgpt-ui">
      <Header />
      <div className="ai-container">
        {/* 左侧会话列表 */}
        <div className="ai-sidebar">
          <div className="sidebar-header">
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={startNewConversation}
              block
              className="new-chat-btn"
            >
              新对话
            </Button>
          </div>
          <div className="sidebar-content">
            {loadingSessions ? (
              <div className="loading-sessions">
                <Spin size="small" />
                <span>加载中...</span>
              </div>
            ) : sessions.length === 0 ? (
              <div className="empty-sessions">暂无历史对话</div>
            ) : (
              <div className="session-list">
                {sessions.map((sessionId) => {
                  const title =
                    sessionTitles[sessionId] ||
                    (sessionId.length > 20
                      ? sessionId.substring(0, 20) + "..."
                      : sessionId);

                  return (
                    <div
                      key={sessionId}
                      className={`session-item ${
                        currentSessionId === sessionId ? "active" : ""
                      }`}
                      onClick={() => loadSessionHistory(sessionId)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") loadSessionHistory(sessionId);
                      }}
                    >
                      <MessageOutlined />
                      <span className="session-id">{title}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* 右侧对话区域 */}
        <div className="ai-main">
          <Card className="ai-card" bordered={false}>
            <div className="ai-header">
              <div>
                <h2>AI 助教</h2>
                {currentSessionId && (
                  <div className="session-info">
                    {sessionTitles[currentSessionId]
                      ? `主题：${sessionTitles[currentSessionId]}`
                      : "新的对话"}
                  </div>
                )}
              </div>
              <Select
                className="ai-course-select"
                placeholder="选择课程知识库（可选）"
                allowClear
                value={selectedCourseId}
                onChange={(value) => setSelectedCourseId(value)}
                options={courses.map((course) => ({
                  label: course.title,
                  value: course.id,
                }))}
              />
            </div>


            <div className="chat-window" ref={chatWindowRef}>
              {loadingHistory ? (
                <div className="loading-history">
                  <Spin size="large" />
                  <p>加载历史消息中...</p>
                </div>
              ) : messages.length === 0 && !streamingText ? (
                <div className="empty-chat">
                  <MessageOutlined style={{ fontSize: 48, color: "#ccc" }} />
                  <p>开始新的对话吧！</p>
                </div>
              ) : (
                <>
                  {messages.map((msg, index) => (
                    <div
                      key={index}
                      className={`chat-bubble ${
                        msg.type === "USER" ? "user" : "ai"
                      }`}
                    >
                      <div className="chat-role">
                        {msg.type === "USER" ? "我" : "AI"}
                        {msg.type === "AI" && isTeacher && (
                          <Tooltip title="修正/反馈">
                            <Button
                              type="text"
                              size="small"
                              icon={<EditOutlined />}
                              className="feedback-btn"
                              onClick={() => {
                                // Find the preceding user message as the question
                                const prevUserMsg = messages
                                  .slice(0, index)
                                  .reverse()
                                  .find((m) => m.type === "USER");
                                openFeedbackModal(
                                  prevUserMsg?.text || "",
                                  msg.text
                                );
                              }}
                            />
                          </Tooltip>
                        )}
                      </div>
                      {msg.type === "AI" ? (
                        <>
                          <div className="chat-text markdown-content">
                            <ReactMarkdown
                              remarkPlugins={[remarkGfm, remarkMath]}
                              rehypePlugins={[rehypeKatex]}
                              components={MarkdownComponents}
                            >
                              {msg.text}
                            </ReactMarkdown>
                          </div>
                          {msg.sources && msg.sources.length > 0 && (
                            <SourceCitation sources={msg.sources} />
                          )}
                          {/* User evaluation: thumbs up/down + star rating */}
                          <div className="eval-actions">
                            <Tooltip title="有帮助">
                              <Button
                                type="text"
                                size="small"
                                className={`eval-btn thumbs-up ${
                                  evaluations[index] === 1 ? "active" : ""
                                }`}
                                icon={
                                  evaluations[index] === 1 ? (
                                    <LikeFilled />
                                  ) : (
                                    <LikeOutlined />
                                  )
                                }
                                disabled={evaluatingIdx.has(index)}
                                onClick={() =>
                                  void submitEvaluation(index, 1)
                                }
                              />
                            </Tooltip>
                            <Tooltip title="没帮助">
                              <Button
                                type="text"
                                size="small"
                                className={`eval-btn thumbs-down ${
                                  evaluations[index] === -1 ? "active" : ""
                                }`}
                                icon={
                                  evaluations[index] === -1 ? (
                                    <DislikeFilled />
                                  ) : (
                                    <DislikeOutlined />
                                  )
                                }
                                disabled={evaluatingIdx.has(index)}
                                onClick={() =>
                                  void submitEvaluation(index, -1)
                                }
                              />
                            </Tooltip>
                            <span className="eval-divider" />
                            <Tooltip title="为回答质量评分">
                              <span className="eval-rating-inline">
                                <Rate
                                  value={ratings[index] || 0}
                                  onChange={(val) =>
                                    void submitRating(index, val)
                                  }
                                  disabled={evaluatingIdx.has(index)}
                                  style={{ fontSize: 14 }}
                                />
                              </span>
                            </Tooltip>
                          </div>
                        </>
                      ) : (
                        <div className="chat-text">{msg.text}</div>
                      )}
                    </div>
                  ))}

                  {/* 流式临时气泡（实时 Markdown 渲染 + 公式支持） */}
                  {streamingText !== null && (
                    <div className="chat-bubble ai streaming">
                      <div className="chat-role">AI</div>
                      <div className="chat-text markdown-content streaming-markdown">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm, remarkMath]}
                          rehypePlugins={[rehypeKatex]}
                          components={MarkdownComponents}
                        >
                          {streamingText}
                        </ReactMarkdown>

                        <div className="typing-indicator" aria-hidden>
                          <span className="dot" />
                          <span className="dot" />
                          <span className="dot" />
                        </div>
                      </div>
                      {streamingSources.length > 0 && (
                        <SourceCitation sources={streamingSources} />
                      )}
                    </div>
                  )}

                  {/* 当正在 loading 且没有 streamingText 的时候显示思考提示 */}
                  {loading && streamingText === null && (
                    <div className="chat-bubble ai loading">
                      <Spin size="small" />
                      <span style={{ marginLeft: 8 }}>AI 正在思考…</span>
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="chat-input">
              <Input.TextArea
                rows={4}
                placeholder="请输入你的问题..."
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onPressEnter={(e) => {
                  if (!e.shiftKey) {
                    e.preventDefault();
                    if (!loading) void askAI();
                  }
                }}
                disabled={loading}
              />
              <Button
                type="primary"
                onClick={() => {
                  void askAI();
                }}
                loading={loading}
                disabled={loading || !question.trim()}
                className="send-btn"
              >
                发送
              </Button>
            </div>
          </Card>
        </div>
      </div>

      {/* Teacher Feedback Modal */}
      <Modal
        title="教师反馈 / 修正"
        open={feedbackModalOpen}
        onCancel={() => setFeedbackModalOpen(false)}
        onOk={() => void submitFeedback()}
        confirmLoading={feedbackSubmitting}
        okText="提交反馈"
        cancelText="取消"
        width={700}
        className="feedback-modal"
      >
        {feedbackTarget && (
          <div className="feedback-form">
            <div className="feedback-section">
              <label>原始问题：</label>
              <div className="feedback-original-text">{feedbackTarget.question}</div>
            </div>
            <div className="feedback-section">
              <label>AI 原始回答：</label>
              <div className="feedback-original-text ai-answer-preview">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm, remarkMath]}
                  rehypePlugins={[rehypeKatex]}
                  components={MarkdownComponents}
                >
                  {feedbackTarget.answer.length > 500
                    ? feedbackTarget.answer.substring(0, 500) + "..."
                    : feedbackTarget.answer}
                </ReactMarkdown>
              </div>
            </div>
            <div className="feedback-section">
              <label>评分：</label>
              <Rate
                value={feedbackRating}
                onChange={setFeedbackRating}
                character={<StarOutlined />}
              />
            </div>
            <div className="feedback-section">
              <label>修正后的回答（可选）：</label>
              <Input.TextArea
                rows={4}
                placeholder="如果 AI 回答有误，请输入正确的回答..."
                value={feedbackCorrectedAnswer}
                onChange={(e) => setFeedbackCorrectedAnswer(e.target.value)}
              />
            </div>
            <div className="feedback-section">
              <label>评论 / 反馈说明（可选）：</label>
              <Input.TextArea
                rows={2}
                placeholder="请输入您的评论或改进建议..."
                value={feedbackComment}
                onChange={(e) => setFeedbackComment(e.target.value)}
              />
            </div>
          </div>
        )}
      </Modal>

      {/* 底部版权信息 */}
      <div className="ai-footer">
        <p>© Copyright: FlyFish</p>
      </div>
    </div>
  );
}
