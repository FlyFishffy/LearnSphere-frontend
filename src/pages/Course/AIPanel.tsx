import { useState } from "react";
import { Input, Button, message as antdMessage } from "antd";
import { CloseOutlined } from "@ant-design/icons";
import request from "../../api/request";
import type { ApiResponse, MessageVO, ChatRequest } from "../../types/api";
import MessageList from "../AI/MessageList";
import "../AI/AIAssistant.css";
import "../AI/scrollbar.css";
import "./AIPanel.css";


interface AIPanelProps {
  courseId: number;
  onClose: () => void;
}

const createSessionId = () =>
  crypto.randomUUID?.() ??
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

export default function AIPanel({ courseId, onClose }: AIPanelProps) {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<MessageVO[]>([]);
  const [sessionId] = useState(() => createSessionId());
  const [loading, setLoading] = useState(false);

  const askAI = async () => {
    const trimmed = question.trim();
    if (!trimmed) {
      antdMessage.warning("请输入问题");
      return;
    }

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
        courseId: courseId,
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
      } else {
        throw new Error(res.data.message || "获取回答失败");
      }
    } catch (error) {
      antdMessage.error("获取回答失败，请稍后再试");
      console.error("获取回答失败：", error);
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ai-panel">
      <div className="ai-panel-header">
        <h3>课程 AI 助教</h3>
        <Button
          type="text"
          icon={<CloseOutlined />}
          onClick={onClose}
          className="close-btn"
        />
      </div>

      <div className="ai-panel-chat">
        {messages.length === 0 ? (
          <div className="empty-chat">
            <p>💬 向AI助教提问，获取课程相关解答</p>
          </div>
        ) : (
          <MessageList messages={messages} loading={loading} />
        )}
      </div>

      <div className="ai-panel-input">
        <Input.TextArea
          rows={3}
          placeholder="输入你的问题..."
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
    </div>
  );
}
