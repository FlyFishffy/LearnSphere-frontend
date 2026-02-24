import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Card,
  Input,
  Button,
  Spin,
  message as antdMessage,
  Tooltip,
  Select,
} from "antd";

import { PlusOutlined, MessageOutlined, CopyOutlined } from "@ant-design/icons";
import Header from "../../components/Header";
import request from "../../api/request";
import type { ApiResponse, MessageVO, ChatRequest, Course } from "../../types/api";

import { useAuth } from "../../hooks/useAuth";
import "./AIAssistant.css";
import ReactMarkdown from "react-markdown";
import type { Components } from "react-markdown";
import remarkGfm from "remark-gfm";
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

  // 当前流式中的文本（单独一个“打字气泡”，不进 messages）
  const [streamingText, setStreamingText] = useState<string | null>(null);

  // 滚动容器 ref
  const chatWindowRef = useRef<HTMLDivElement | null>(null);

  // 用于临时合并流式文本，减少频繁 setState
  const streamingBufferRef = useRef<string>("");

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
        setSessions(res.data.data || []);
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
      // props.children 的类型由 react-markdown 提供
      return <table className="markdown-table">{props.children}</table>;
    },
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

      // 解析 SSE：保持原始 data 内容（不 trim），当 data 为 "" 时解释为换行
      while (!done) {
        const { value, done: streamDone } = await reader.read();
        if (streamDone) break;

        buffer += decoder.decode(value, { stream: true });

        // SSE 事件通常以 \n\n 分隔
        const events = buffer.split("\n\n");
        buffer = events.pop() || "";

        for (const rawEvent of events) {
          const lines = rawEvent.split("\n");
          for (const line of lines) {
            if (!line.startsWith("data:")) {
              continue;
            }
            // 保留 data 后的原始内容（包含空格）
            const data = line.slice("data:".length);

            // 终止符
            if (data === "[DONE]" || data === "[DONE]\r") {
              done = true;
              break;
            }

            // 空 data 表示显式换行
            const piece = data === "" ? "\n" : data;

            // 拼接（不做 trim）
            aiText += piece;

            // 更新流式 buffer 并触发渲染（合并后一次 set）
            streamingBufferRef.current = aiText;
            setStreamingText(streamingBufferRef.current);
          }
          if (done) break;
        }
      }

      // 流结束：清除流式气泡并写入完整 AI 消息
      setStreamingText(null);

      if (aiText) {
        setMessages((prev) => [
          ...prev,
          {
            type: "AI",
            text: aiText,
          },
        ]);
      }

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
                      </div>
                      {msg.type === "AI" ? (
                        <div className="chat-text markdown-content">
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={MarkdownComponents}
                          >
                            {msg.text}
                          </ReactMarkdown>
                        </div>
                      ) : (
                        <div className="chat-text">{msg.text}</div>
                      )}
                    </div>
                  ))}

                  {/* 流式临时气泡（实时 Markdown 渲染） */}
                  {streamingText !== null && (
                    <div className="chat-bubble ai streaming">
                      <div className="chat-role">AI</div>
                      <div className="chat-text markdown-content streaming-markdown">
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

      {/* 底部版权信息 */}
      <div className="ai-footer">
        <p>© Copyright: FlyFish</p>
      </div>
    </div>
  );
}
