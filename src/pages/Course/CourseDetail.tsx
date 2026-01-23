import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import remarkGfm from "remark-gfm";
import { Button, Spin } from "antd";
import { RobotOutlined, CloseOutlined } from "@ant-design/icons";
import Header from "../../components/Header";
import type { Course } from "../../types/api";
import { mockCourses } from "../../data/mockCourses";
import AIPanel from "./AIPanel";
import "./CourseDetail.css";

export default function CourseDetail() {
  const { id } = useParams<{ id: string }>();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [aiPanelVisible, setAiPanelVisible] = useState(false);

  useEffect(() => {
    const loadCourse = () => {
      setLoading(true);
      
      // 使用 mock 数据
      const foundCourse = mockCourses.find((c) => c.id === Number(id));
      setCourse(foundCourse || null);
      
      // 未来对接后端接口
      // request.get<ApiResponse<Course>>(`/course/detail/${id}`).then((res) => {
      //   setCourse(res.data.data);
      // });
      
      setLoading(false);
    };

    loadCourse();
  }, [id]);

  if (loading) {
    return (
      <div className="course-detail-wrapper">
        <Header />
        <div className="course-loading">
          <Spin size="large" />
          <p>加载课程内容中...</p>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="course-detail-wrapper">
        <Header />
        <div className="course-not-found">
          <h2>课程不存在</h2>
          <p>抱歉，未找到该课程内容</p>
        </div>
      </div>
    );
  }

  return (
    <div className="course-detail-wrapper">
      <Header />
      <div className={`course-detail-container ${aiPanelVisible ? "split-view" : ""}`}>
        {/* Markdown 内容区域 */}
        <div className="markdown-container">
          <div className="markdown-content">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                code({ inline, className, children, ...props }) {
                  const match = /language-(\w+)/.exec(className || "");
                  return !inline && match ? (
                    <SyntaxHighlighter
                      style={vscDarkPlus}
                      language={match[1]}
                      PreTag="div"
                      {...props}
                    >
                      {String(children).replace(/\n$/, "")}
                    </SyntaxHighlighter>
                  ) : (
                    <code className={className} {...props}>
                      {children}
                    </code>
                  );
                },
              }}
            >
              {course.content}
            </ReactMarkdown>
          </div>
        </div>

        {/* AI 对话面板 */}
        {aiPanelVisible && (
          <div className="ai-panel-container">
            <AIPanel courseId={course.id} onClose={() => setAiPanelVisible(false)} />
          </div>
        )}

        {/* AI 助教按钮 */}
        <Button
          className={`ai-toggle-btn ${aiPanelVisible ? "active" : ""}`}
          type="primary"
          shape="circle"
          size="large"
          icon={aiPanelVisible ? <CloseOutlined /> : <RobotOutlined />}
          onClick={() => setAiPanelVisible(!aiPanelVisible)}
        />
      </div>
    </div>
  );
}
