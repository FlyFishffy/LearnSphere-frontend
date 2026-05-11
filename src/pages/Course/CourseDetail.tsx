import React, { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Header from "../../components/Header";
import request from "../../api/request";
import type { ApiResponse, Course, LearningRecord, MessageVO, ChatRequest } from "../../types/api";
import {
  Card,
  Spin,
  Tag,
  Empty,
  Button,
  Progress,
  Space,
  message as antdMessage,
  Input,
  Tooltip,
  Segmented,
} from "antd";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useAuth } from "../../hooks/useAuth";
import { RobotOutlined, CloseOutlined, SendOutlined, CopyOutlined, DatabaseOutlined, PlayCircleOutlined, ReadOutlined } from "@ant-design/icons";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import type { Components } from "react-markdown";
import "./CourseDetail.css";

/** Format seconds into human-readable duration string (in hours) */
const formatStudyTime = (seconds: number): string => {
  const hours = seconds / 3600;
  if (hours < 0.01) return "0小时";
  return `${hours.toFixed(2)}小时`;
};

const createSessionId = (): string =>
  typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

export default function CourseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [recordLoading, setRecordLoading] = useState<boolean>(false);
  const [favoriteLoading, setFavoriteLoading] = useState<boolean>(false);
  const [record, setRecord] = useState<LearningRecord | null>(null);
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [isFavorite, setIsFavorite] = useState<boolean>(false);

  // Document reading progress tracking
  const contentRef = useRef<HTMLDivElement | null>(null);
  const sessionStartRef = useRef<number>(Date.now());
  const maxScrollPercentRef = useRef<number>(0);
  const saveTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Content display mode: "video" or "document"
  const [contentMode, setContentMode] = useState<string>("video");
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const videoProgressTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // AI 对话面板状态
  const [aiPanelOpen, setAiPanelOpen] = useState<boolean>(false);
  const [aiQuestion, setAiQuestion] = useState<string>("");
  const [aiMessages, setAiMessages] = useState<MessageVO[]>([]);
  const [aiLoading, setAiLoading] = useState<boolean>(false);
  const [streamingText, setStreamingText] = useState<string | null>(null);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const streamingBufferRef = useRef<string>("");
  const chatWindowRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    request
      .get<ApiResponse<Course>>(`/course/get/${id}`)
      .then((res) => {
        const c = res.data.data || null;
        setCourse(c);
        // Default to video mode if video exists, otherwise document
        if (c?.videoUrl) {
          setContentMode("video");
        } else {
          setContentMode("document");
        }
      })
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!user || !id) return;
    const courseId = Number(id);
    setRecordLoading(true);
    setFavoriteLoading(true);
    Promise.all([
      request.get<ApiResponse<LearningRecord[]>>("/learning/record/list"),
      request.get<ApiResponse<Course[]>>("/learning/favorite/list"),
    ])
      .then(([recordRes, favoriteRes]) => {
        const recordList = recordRes.data.data || [];
        const targetRecord = recordList.find(
          (item) => item.courseId === courseId
        );
        setRecord(targetRecord || null);
        setProgressPercent(targetRecord?.progressPercent ?? 0);
        maxScrollPercentRef.current = targetRecord?.progressPercent ?? 0;

        const favoriteList = favoriteRes.data.data || [];
        setIsFavorite(favoriteList.some((item) => item.id === courseId));
      })
      .finally(() => {
        setRecordLoading(false);
        setFavoriteLoading(false);
      });
  }, [id, user]);

  // Calculate content length from Markdown text
  const contentLength = course?.contentMd?.length || 0;

  // Save reading progress to backend
  const saveReadingProgress = useCallback(async () => {
    if (!user || !course) return;
    const currentPercent = maxScrollPercentRef.current;
    const scrollPosition = Math.round((currentPercent / 100) * contentLength);
    const elapsed = Math.round((Date.now() - sessionStartRef.current) / 1000);
    sessionStartRef.current = Date.now();
    if (elapsed <= 0 && scrollPosition <= 0) return;
    try {
      await request.post("/learning/record/update", {
        courseId: course.id,
        scrollPosition,
        contentLength,
        studySecondsIncrement: elapsed > 0 ? elapsed : undefined,
      });
      setRecord((prev) => ({
        id: prev?.id || 0,
        userId: prev?.userId || 0,
        courseId: course.id,
        progressPercent: currentPercent,
        scrollPosition,
        contentLength,
        totalStudySeconds: (prev?.totalStudySeconds || 0) + elapsed,
        lastLearningTime: new Date().toISOString(),
      }));
    } catch {
      // Silently fail for auto-save
    }
  }, [user, course, contentLength]);

  // Track scroll position to compute reading progress
  useEffect(() => {
    const contentEl = contentRef.current;
    if (!contentEl || !course?.contentMd) return;

    const handleScroll = () => {
      const rect = contentEl.getBoundingClientRect();
      const contentHeight = contentEl.scrollHeight;
      const viewportHeight = window.innerHeight;
      // How much of the content has been scrolled past the viewport top
      const scrolledPast = Math.max(0, -rect.top + viewportHeight);
      const percent = Math.min(100, Math.round((scrolledPast / contentHeight) * 100));
      if (percent > maxScrollPercentRef.current) {
        maxScrollPercentRef.current = percent;
        setProgressPercent(percent);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    // Run once on mount to capture initial position
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [course]);

  // Auto-save reading progress every 30 seconds + on page leave
  useEffect(() => {
    if (!user || !course) return;
    sessionStartRef.current = Date.now();
    saveTimerRef.current = setInterval(() => {
      void saveReadingProgress();
    }, 30000);

    // Save when user closes / refreshes the page
    const handleBeforeUnload = () => {
      void saveReadingProgress();
    };
    // Save when user switches to another tab
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        void saveReadingProgress();
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      if (saveTimerRef.current) clearInterval(saveTimerRef.current);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      // Save on unmount (route navigation)
      void saveReadingProgress();
    };
  }, [user, course, saveReadingProgress]);

  // 自动滚动到底部
  useEffect(() => {
    const el = chatWindowRef.current;
    if (!el) return;
    requestAnimationFrame(() => {
      el.scrollTop = el.scrollHeight;
    });
  }, [aiMessages, streamingText]);

  // 复制到剪贴板
  const copyToClipboard = useCallback(async (text: string): Promise<void> => {
    try {
      await navigator.clipboard.writeText(text);
      antdMessage.success("已复制到剪贴板");
    } catch {
      antdMessage.error("复制失败");
    }
  }, []);

  // Markdown 代码块组件
  type CodeComponentProps = React.DetailedHTMLProps<
    React.HTMLAttributes<HTMLElement>,
    HTMLElement
  > & { inline?: boolean; className?: string; children?: React.ReactNode };

  const MarkdownComponents: Components = {
    code: (props: CodeComponentProps) => {
      const { inline, className, children } = props;
      const value = String(children).replace(/\n$/, "");
      const match = /language-(\w+)/.exec(className || "");
      const language = match ? match[1] : "";
      if (inline) {
        return <code className={className}>{children}</code>;
      }
      return (
        <div className="code-block-wrapper" role="group">
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
  };

  // SSE 流式问答
  const askAI = useCallback(async (): Promise<void> => {
    const trimmed = aiQuestion.trim();
    if (!trimmed) {
      antdMessage.warning("请输入问题");
      return;
    }
    if (!user) {
      antdMessage.warning("请先登录");
      navigate("/login");
      return;
    }

    const sessionId = currentSessionId || createSessionId();
    if (!currentSessionId) {
      setCurrentSessionId(sessionId);
    }

    const userMessage: MessageVO = { type: "USER", text: trimmed };
    setAiMessages((prev) => [...prev, userMessage]);
    setAiQuestion("");
    setAiLoading(true);
    setStreamingText("");
    streamingBufferRef.current = "";

    try {
      const chatRequest: ChatRequest = {
        question: trimmed,
        sessionId,
        courseId: id ? Number(id) : undefined,
      };

      const response = await fetch("/api/ai/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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

      while (!done) {
        const { value, done: streamDone } = await reader.read();
        if (streamDone) break;
        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split("\n\n");
        buffer = events.pop() || "";

        for (const rawEvent of events) {
          const lines = rawEvent.split("\n");
          for (const line of lines) {
            if (!line.startsWith("data:")) continue;
            const data = line.slice("data:".length);
            if (data === "[DONE]" || data === "[DONE]\r") {
              done = true;
              break;
            }
            const piece = data === "" ? "\n" : data;
            aiText += piece;
            streamingBufferRef.current = aiText;
            setStreamingText(streamingBufferRef.current);
          }
          if (done) break;
        }
      }

      setStreamingText(null);
      if (aiText) {
        setAiMessages((prev) => [...prev, { type: "AI", text: aiText }]);
      }
    } catch (error) {
      antdMessage.error("获取回答失败，请稍后再试");
      console.error("AI 问答失败：", error);
      setStreamingText(null);
      setAiMessages((prev) => (prev.length >= 1 ? prev.slice(0, -1) : prev));
    } finally {
      setAiLoading(false);
    }
  }, [aiQuestion, currentSessionId, id, user, navigate]);

  if (loading) {
    return (
      <div className="course-detail-page">
        <Header />
        <div className="course-detail-loading">
          <Spin size="large" />
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="course-detail-page">
        <Header />
        <div className="course-detail-empty">
          <Empty description="课程不存在或已删除" />
        </div>
      </div>
    );
  }

  const tags = course.tags ? course.tags.split(",").filter(Boolean) : [];

  const handleToggleFavorite = async () => {
    if (!user) {
      antdMessage.warning("请先登录");
      navigate("/login");
      return;
    }
    if (!course) return;
    setFavoriteLoading(true);
    try {
      if (isFavorite) {
        await request.delete(`/learning/favorite/${course.id}`);
        setIsFavorite(false);
        antdMessage.success("已取消收藏");
      } else {
        await request.post(`/learning/favorite/${course.id}`);
        setIsFavorite(true);
        antdMessage.success("已加入收藏");
      }
    } finally {
      setFavoriteLoading(false);
    }
  };



  return (
    <div className="course-detail-page">
      <Header />
      <div className="course-detail-container">
        <Card className="course-detail-card" bordered={false}>
          <div className="course-detail-header">
            <div>
              <h1 className="course-detail-title">{course.title}</h1>
              <div className="course-detail-meta">
                {course.category && <Tag color="blue">{course.category}</Tag>}
                {tags.map((tag) => (
                  <Tag key={tag}>{tag}</Tag>
                ))}
              </div>
            </div>
            <div className="course-detail-actions">
              {user && ["Teacher", "Admin"].includes(user.roleType) && (
                <Space>
                  <Button
                    type="primary"
                    onClick={() => navigate(`/courses/edit/${course.id}`)}
                  >
                    编辑课程
                  </Button>
                  <Button
                    icon={<DatabaseOutlined />}
                    onClick={() => navigate(`/knowledge/${course.id}`)}
                  >
                    知识库管理
                  </Button>
                </Space>
              )}
              {course.coverUrl && (
                <img
                  className="course-detail-cover"
                  src={course.coverUrl}
                  alt={course.title}
                />
              )}
            </div>
          </div>

          {course.description && (
            <div className="course-detail-desc">{course.description}</div>
          )}

          <div className="course-detail-learning">
            <div className="learning-panel">
              <div className="learning-panel-title">
                {contentMode === "video" ? "观看进度" : "阅读进度"}
              </div>
              <Progress percent={progressPercent} status={progressPercent >= 100 ? "success" : "active"} />
              <div className="learning-panel-meta">
                {progressPercent >= 100
                  ? "🎉 已学习完毕"
                  : contentMode === "video"
                    ? "继续观看视频，进度将自动更新"
                    : "继续向下滚动阅读，进度将自动更新"}
              </div>
              <div className="learning-panel-meta">
                累计学习时长：{record?.totalStudySeconds ? formatStudyTime(record.totalStudySeconds) : "0小时"}　|　最近学习：{record?.lastLearningTime || "-"}
              </div>
              <Space wrap>
                <Button
                  type={isFavorite ? "default" : "primary"}
                  loading={favoriteLoading}
                  onClick={handleToggleFavorite}
                >
                  {isFavorite ? "取消收藏" : "收藏课程"}
                </Button>
              </Space>
              {recordLoading && <div className="learning-panel-hint">加载中...</div>}
            </div>
          </div>

          {/* Content mode switcher — show only when both video and markdown exist */}
          {course.videoUrl && course.contentMd && (
            <div className="content-mode-switcher">
              <Segmented
                options={[
                  { label: <span><PlayCircleOutlined /> 视频学习</span>, value: "video" },
                  { label: <span><ReadOutlined /> 文档阅读</span>, value: "document" },
                ]}
                value={contentMode}
                onChange={(val) => setContentMode(val as string)}
              />
            </div>
          )}

          {/* Video Player */}
          {contentMode === "video" && course.videoUrl && (
            <div className="course-video-container">
              <video
                ref={videoRef}
                src={course.videoUrl}
                controls
                className="course-video-player"
                onTimeUpdate={() => {
                  const video = videoRef.current;
                  if (video && video.duration) {
                    const percent = Math.round((video.currentTime / video.duration) * 100);
                    if (percent > maxScrollPercentRef.current) {
                      maxScrollPercentRef.current = percent;
                      setProgressPercent(percent);
                    }
                  }
                }}
                onEnded={() => {
                  maxScrollPercentRef.current = 100;
                  setProgressPercent(100);
                }}
              >
                您的浏览器不支持视频播放
              </video>
              {course.videoDuration && (
                <div className="course-video-duration">
                  视频时长：{Math.floor(course.videoDuration / 60)}分{course.videoDuration % 60}秒
                </div>
              )}
            </div>
          )}

          {/* Markdown Content */}
          {(contentMode === "document" || !course.videoUrl) && (
            <div className="course-detail-content" ref={contentRef}>
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {course.contentMd || "暂无课程内容"}
              </ReactMarkdown>
            </div>
          )}
        </Card>
      </div>

      {/* AI 悬浮按钮 */}
      <Tooltip title="AI 课程助手" placement="left">
        <button
          className={`ai-float-btn ${aiPanelOpen ? "active" : ""}`}
          onClick={() => setAiPanelOpen((prev) => !prev)}
          aria-label="打开 AI 课程助手"
        >
          <RobotOutlined />
        </button>
      </Tooltip>

      {/* AI 对话面板（右侧抽屉） */}
      <div className={`ai-chat-panel ${aiPanelOpen ? "open" : ""}`}>
        {/* 面板头部 */}
        <div className="ai-panel-header">
          <div className="ai-panel-title">
            <RobotOutlined />
            <span>AI 课程助手</span>
          </div>
          <div className="ai-panel-subtitle">基于《{course.title}》课程内容回答</div>
          <button
            className="ai-panel-close"
            onClick={() => setAiPanelOpen(false)}
            aria-label="关闭"
          >
            <CloseOutlined />
          </button>
        </div>

        {/* 消息列表 */}
        <div className="ai-panel-messages" ref={chatWindowRef}>
          {aiMessages.length === 0 && streamingText === null ? (
            <div className="ai-panel-empty">
              <RobotOutlined style={{ fontSize: 36, color: "#c0c4cc" }} />
              <p>你好！我是 AI 课程助手</p>
              <p className="ai-panel-empty-hint">可以向我提问关于本课程的任何问题</p>
            </div>
          ) : (
            <>
              {aiMessages.map((msg, index) => (
                <div
                  key={index}
                  className={`ai-panel-bubble ${msg.type === "USER" ? "user" : "ai"}`}
                >
                  <div className="ai-panel-role">{msg.type === "USER" ? "我" : "AI"}</div>
                  {msg.type === "AI" ? (
                    <div className="ai-panel-text markdown-content">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={MarkdownComponents}
                      >
                        {msg.text}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <div className="ai-panel-text">{msg.text}</div>
                  )}
                </div>
              ))}

              {/* 流式气泡 */}
              {streamingText !== null && (
                <div className="ai-panel-bubble ai streaming">
                  <div className="ai-panel-role">AI</div>
                  <div className="ai-panel-text markdown-content">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
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
                </div>
              )}

              {aiLoading && streamingText === null && (
                <div className="ai-panel-bubble ai">
                  <Spin size="small" />
                  <span style={{ marginLeft: 8, fontSize: 13, color: "#718096" }}>
                    AI 正在思考…
                  </span>
                </div>
              )}
            </>
          )}
        </div>

        {/* 输入区域 */}
        <div className="ai-panel-input">
          <Input.TextArea
            rows={3}
            placeholder="输入问题，按 Enter 发送，Shift+Enter 换行"
            value={aiQuestion}
            onChange={(e) => setAiQuestion(e.target.value)}
            onPressEnter={(e) => {
              if (!e.shiftKey) {
                e.preventDefault();
                if (!aiLoading) void askAI();
              }
            }}
            disabled={aiLoading}
          />
          <Button
            type="primary"
            icon={<SendOutlined />}
            onClick={() => void askAI()}
            loading={aiLoading}
            disabled={aiLoading || !aiQuestion.trim()}
            className="ai-panel-send-btn"
          >
            发送
          </Button>
        </div>
      </div>

      {/* 遮罩层（移动端） */}
      {aiPanelOpen && (
        <div
          className="ai-panel-overlay"
          onClick={() => setAiPanelOpen(false)}
        />
      )}
    </div>
  );
}
