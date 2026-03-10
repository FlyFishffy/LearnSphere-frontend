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
            开启你的
            <span className="gradient-text">学习之旅</span>
          </h1>
          <p className="hero-subtitle">
            探索丰富的在线课程，提升技能，实现职业梦想
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
            <p className="section-description">根据你的学习偏好，精选优质课程</p>
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
      </div>
    </div>
  );
}
