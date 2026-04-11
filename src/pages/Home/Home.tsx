import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../../components/Header";
import request from "../../api/request";
import type { ApiResponse, Course, RecommendClickRequest } from "../../types/api";
import { Tag } from "antd";
import "./Home.css";

export default function Home() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadRecommendations = async () => {
      setLoading(true);
      try {
        const res = await request.get<ApiResponse<Course[]>>(
          "/learning/home-recommend",
          { params: { limit: 3 } }
        );
        setCourses(res.data.data || []);
      } catch {
        setCourses([]);
      } finally {
        setLoading(false);
      }
    };
    loadRecommendations();
  }, []);

  const badgeLabels = ["热门", "推荐", "新课"];

  /** Log recommendation click for performance tracking */
  const logRecommendClick = async (courseId: number, position: number) => {
    try {
      const body: RecommendClickRequest = {
        courseId,
        source: "home",
        recommendCount: courses.length,
        position,
      };
      await request.post("/recommend/click", body);
    } catch {
      // silently fail — click tracking should not affect UX
    }
  };

  return (
    <div className="home-wrapper">
      <Header />

      {/* 英雄区域 */}
      <div className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">
            厚德求真，
            <span className="gradient-text">砺学笃行</span>
          </h1>
          <p className="hero-subtitle">
            数据结构 · 操作系统 · 编译原理 · 人工智能 · 信息安全 · 信号处理
          </p>
        </div>
        <div className="hero-decoration">
          <div className="floating-shape shape-1"></div>
          <div className="floating-shape shape-2"></div>
          <div className="floating-shape shape-3"></div>
        </div>
      </div>

      <div className="home-container">
        {/* 推荐课程区域 */}
        <div className="home-section">
          <div className="section-header">
            <h2 className="recommend-title">
              <span className="title-icon">✨</span>
              推荐课程
            </h2>
            <p className="section-description">基于你的学习轨迹，智能推荐核心课程</p>
          </div>

          <div className="recommend-courses">
            {loading ? (
              <>
                {[0, 1, 2].map((i) => (
                  <div key={i} className="course-card course-card-loading">
                    <div className="course-image">
                      <div className="course-badge">加载中</div>
                    </div>
                    <div className="course-content">
                      <h3 className="course-title">课程加载中...</h3>
                      <p className="course-description">正在为您准备精彩内容</p>
                    </div>
                  </div>
                ))}
              </>
            ) : courses.length === 0 ? (
              <div className="no-courses-hint">
                暂无推荐课程，快去浏览课程开始学习吧！
              </div>
            ) : (
              courses.map((course, index) => {
                const tags = course.tags
                  ? course.tags.split(",").filter(Boolean)
                  : [];
                return (
                  <div
                    key={course.id}
                    className="course-card"
                    onClick={() => {
                      void logRecommendClick(course.id, index);
                      navigate(`/courses/${course.id}`);
                    }}
                  >
                    <div className="course-image">
                      <div className="course-badge">
                        {badgeLabels[index % badgeLabels.length]}
                      </div>
                    </div>
                    <div className="course-content">
                      <h3 className="course-title">{course.title}</h3>
                      <p className="course-description">
                        {course.description || "暂无简介"}
                      </p>
                      <div className="course-meta-tags">
                        {course.category && (
                          <Tag color="blue">{course.category}</Tag>
                        )}
                        {tags.slice(0, 3).map((tag) => (
                          <Tag key={tag}>{tag.trim()}</Tag>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* 课程方向 */}
        <div className="home-section directions-section">
          <div className="section-header">
            <h2 className="recommend-title">
              <span className="title-icon">🎓</span>
              课程方向
            </h2>
            <p className="section-description">
              覆盖计算机学院核心培养方向
            </p>
          </div>

          <div className="direction-grid">
            {[
              {
                icon: "💻",
                title: "计算机科学",
                desc: "数据结构、算法设计与分析、计算机组成原理、操作系统、编译原理",
                color: "#667eea",
              },
              {
                icon: "🤖",
                title: "人工智能",
                desc: "机器学习、深度学习、计算机视觉、自然语言处理、智能信息处理",
                color: "#f093fb",
              },
              {
                icon: "🔐",
                title: "网络安全",
                desc: "信息安全、密码学基础、网络对抗、信息对抗技术、安全协议分析",
                color: "#4facfe",
              },
              {
                icon: "⚙️",
                title: "软件工程",
                desc: "软件工程、面向对象程序设计、软件体系结构、数据库系统、软件测试",
                color: "#43e97b",
              },
              {
                icon: "📡",
                title: "电子工程",
                desc: "数字信号处理、通信原理、电磁场与天线、微机系统与接口技术",
                color: "#fa709a",
              },
              {
                icon: "📐",
                title: "数学基础",
                desc: "离散数学、线性代数、概率论与数理统计、数值分析、信息论基础",
                color: "#fee140",
              },
            ].map((dir) => (
              <div
                key={dir.title}
                className="direction-card"
                onClick={() => navigate("/courses")}
              >
                <div
                  className="direction-icon"
                  style={{ background: `${dir.color}20` }}
                >
                  <span>{dir.icon}</span>
                </div>
                <h3 className="direction-title">{dir.title}</h3>
                <p className="direction-desc">{dir.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
