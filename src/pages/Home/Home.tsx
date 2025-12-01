import Header from "../../components/Header";
import "./Home.css";

export default function Home() {
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
          <div className="hero-buttons">
            <button className="btn-primary">开始学习</button>
            <button className="btn-secondary">浏览课程</button>
          </div>
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
            <p className="section-description">精选优质课程，助你快速成长</p>
          </div>

          <div className="recommend-courses">
            <div className="course-card">
              <div className="course-image">
                <div className="course-badge">热门</div>
              </div>
              <div className="course-content">
                <h3 className="course-title">课程加载中...</h3>
                <p className="course-description">正在为您准备精彩内容</p>
                <div className="course-footer">
                  <span className="course-stats">0 学员</span>
                  <span className="course-rating">⭐⭐⭐⭐⭐</span>
                </div>
              </div>
            </div>

            <div className="course-card">
              <div className="course-image">
                <div className="course-badge">推荐</div>
              </div>
              <div className="course-content">
                <h3 className="course-title">课程加载中...</h3>
                <p className="course-description">正在为您准备精彩内容</p>
                <div className="course-footer">
                  <span className="course-stats">0 学员</span>
                  <span className="course-rating">⭐⭐⭐⭐⭐</span>
                </div>
              </div>
            </div>

            <div className="course-card">
              <div className="course-image">
                <div className="course-badge">新课</div>
              </div>
              <div className="course-content">
                <h3 className="course-title">课程加载中...</h3>
                <p className="course-description">正在为您准备精彩内容</p>
                <div className="course-footer">
                  <span className="course-stats">0 学员</span>
                  <span className="course-rating">⭐⭐⭐⭐⭐</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
