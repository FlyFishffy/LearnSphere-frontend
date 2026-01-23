import { useState, useEffect, useCallback } from "react";
import { Card, Input, Button, Spin, message as antdMessage } from "antd";
import { PlusOutlined, MessageOutlined } from "@ant-design/icons";
import Header from "../../components/Header";
import request from "../../api/request";
import type { ApiResponse, MessageVO, ChatRequest } from "../../types/api";
import { useAuth } from "../../hooks/useAuth";
import MessageList from "./MessageList";
import "./AIAssistant.css";
import "./scrollbar.css";

const createSessionId = () =>
  crypto.randomUUID?.() ??
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

// 根据用户第一句话生成一个简单标题
const generateSessionTitle = (text: string) => {
  const normalized = text.trim().replace(/\s+/g, " ");
  if (!normalized) return "新的对话";
  // 截断长度可根据需要调整
  return normalized.length > 20 ? normalized.slice(0, 20) + "..." : normalized;
};

export default function AIAssistant() {
  const { user } = useAuth();
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<MessageVO[]>([]);
  const [sessions, setSessions] = useState<string[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // 会话 ID -> 标题（用户第一句话的简要总结）
  const [sessionTitles, setSessionTitles] = useState<Record<string, string>>(
    {}
  );

  // 加载会话列表
  const loadSessions = useCallback(async () => {
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

  // 加载会话历史
  const loadSessionHistory = async (sessionId: string) => {
    setLoadingHistory(true);
    try {
      const res = await request.get<ApiResponse<MessageVO[]>>(
        `/ai/get/session/${sessionId}`
      );
      if (res.data.code === 200) {
        const history = res.data.data || [];
        setMessages(history);
        setCurrentSessionId(sessionId);

        // 根据历史中的第一条用户消息设置标题
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
  };

  // 开始新对话
  const startNewConversation = () => {
    const newSessionId = createSessionId();
    setCurrentSessionId(newSessionId);
    setMessages([]);
    setQuestion("");
    antdMessage.success("已开始新的对话");
  };

  // 发送消息
  const askAI = async () => {
    const trimmed = question.trim();
    if (!trimmed) {
      antdMessage.warning("请输入问题");
      return;
    }

    // 如果没有当前会话，创建新会话
    const sessionId = currentSessionId || createSessionId();
    if (!currentSessionId) {
      setCurrentSessionId(sessionId);
    }

    // 根据用户第一句话设置/更新该会话的标题（只在还没有标题时写入）
    setSessionTitles((prev) => ({
      ...prev,
      [sessionId]: prev[sessionId] || generateSessionTitle(trimmed),
    }));

    // 添加用户消息到界面
    const userMessage: MessageVO = {
      type: "USER",
      text: trimmed,
    };
    setMessages((prev) => [...prev, userMessage]);
    setQuestion("");
    setLoading(true);

    try {
      const chatRequest: ChatRequest = {
        question: trimmed,
        sessionId: sessionId,
      };

      const res = await request.post<ApiResponse<string>>(
        "/ai/ask",
        chatRequest
      );

      if (res.data.code === 200) {
        const aiMessage: MessageVO = {
          type: "AI",
          text: res.data.data,
        };
        setMessages((prev) => [...prev, aiMessage]);

        // 如果这是新会话，刷新会话列表
        if (!sessions.includes(sessionId)) {
          await loadSessions();
        }
      } else {
        throw new Error(res.data.message || "获取回答失败");
      }
    } catch (error) {
      antdMessage.error("获取回答失败，请稍后再试");
      console.error("获取回答失败：", error);
      // 移除刚刚添加的用户消息
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setLoading(false);
    }
  };

  // 组件挂载时加载会话列表
  useEffect(() => {
    if (user) {
      loadSessions();
    }
  }, [loadSessions, user]);

  return (
    <div className="ai-wrapper">
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
          <div className="sidebar-content sidebar-scrollbar custom-scrollbar">
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
              <h2>AI 助教</h2>
              {currentSessionId && (
                <div className="session-info">
                  {sessionTitles[currentSessionId]
                    ? `主题：${sessionTitles[currentSessionId]}`
                    : "新的对话"}
                </div>
              )}
            </div>

            <div className="chat-window custom-scrollbar">
              {loadingHistory ? (
                <div className="loading-history">
                  <Spin size="large" />
                  <p>加载历史消息中...</p>
                </div>
              ) : messages.length === 0 ? (
                <div className="empty-chat">
                  <MessageOutlined style={{ fontSize: 48, color: "#ccc" }} />
                  <p>开始新的对话吧！</p>
                </div>
              ) : (
                <MessageList messages={messages} loading={loading} />
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
                    askAI();
                  }
                }}
                disabled={loading}
              />
              <Button
                type="primary"
                onClick={askAI}
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
    </div>
  );
}
