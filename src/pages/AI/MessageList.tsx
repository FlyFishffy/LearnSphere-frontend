import { useRef, useEffect, useState } from "react";
import * as ReactWindow from "react-window";
import { Spin } from "antd";
import type { MessageVO } from "../../types/api";

const { VariableSizeList } = ReactWindow;

interface MessageListProps {
  messages: MessageVO[];
  loading: boolean;
}

const MessageList: React.FC<MessageListProps> = ({ messages, loading }) => {
  const listRef = useRef<VariableSizeList>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const itemHeightCache = useRef<Map<number, number>>(new Map());
  const [containerHeight, setContainerHeight] = useState(500);

  // 监听容器尺寸变化
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        setContainerHeight(containerRef.current.clientHeight);
      }
    };

    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  // 估算消息高度的函数
  const getItemSize = (index: number): number => {
    // 先检查缓存
    if (itemHeightCache.current.has(index)) {
      return itemHeightCache.current.get(index)!;
    }

    const message = messages[index];
    if (!message) return 100;

    // 基础高度：角色名(20px) + padding(24px) + gap(8px) + margin-bottom(16px)
    let estimatedHeight = 68;

    // 根据文本长度估算高度
    const textLength = message.text.length;
    const charsPerLine = message.type === "USER" ? 35 : 45;
    const lines = Math.ceil(textLength / charsPerLine);
    const lineHeight = 24;

    estimatedHeight += lines * lineHeight;

    // 换行符增加高度
    const newlines = (message.text.match(/\n/g) || []).length;
    estimatedHeight += newlines * lineHeight;

    // 设置最小高度
    estimatedHeight = Math.max(estimatedHeight, 96);

    // 缓存计算结果
    itemHeightCache.current.set(index, estimatedHeight);

    return estimatedHeight;
  };

  // 消息更新时滚动到底部
  useEffect(() => {
    if (listRef.current && messages.length > 0) {
      // 延迟滚动以确保渲染完成
      setTimeout(() => {
        listRef.current?.scrollToItem(messages.length - 1, "end");
      }, 100);
    }
  }, [messages.length]);

  // 渲染单条消息
  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => {
    const msg = messages[index];
    if (!msg) return null;

    return (
      <div style={style}>
        <div className={`chat-bubble ${msg.type === "USER" ? "user" : "ai"}`}>
          <div className="chat-role">{msg.type === "USER" ? "我" : "AI"}</div>
          <div className="chat-text">{msg.text}</div>
        </div>
      </div>
    );
  };

  // 如果没有消息，显示空状态
  if (messages.length === 0) {
    return null; // 让父组件处理空状态
  }

  return (
    <div ref={containerRef} style={{ width: "100%", height: "100%", position: "relative" }}>
      {containerHeight > 0 && (
        <VariableSizeList
          ref={listRef}
          className="custom-scrollbar"
          height={containerHeight}
          itemCount={messages.length}
          itemSize={getItemSize}
          width="100%"
          overscanCount={5}
        >

          {Row}
        </VariableSizeList>
      )}
      {loading && (
        <div className="chat-bubble ai loading">
          <Spin size="small" />
          <span>AI 正在思考…</span>
        </div>
      )}
    </div>
  );
};

export default MessageList;
