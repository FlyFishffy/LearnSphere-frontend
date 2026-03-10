import { useCallback, useEffect, useMemo, useState } from "react";
import Header from "../../components/Header";
import request from "../../api/request";
import type {
  ApiResponse,
  Course,
  LearningAnalysis,
  LearningRecord,
  LearningReport,
  ChatEvaluationStats,
  RecommendStats,
  RecommendCourseClick,
} from "../../types/api";
import {
  Card,
  Empty,
  Spin,
  Tabs,
  List,
  Progress,
  Button,
  Row,
  Col,
  Statistic,
  Tag,
  Table,
  Divider,
} from "antd";
import {
  LikeOutlined,
  DislikeOutlined,
  StarOutlined,
  BarChartOutlined,
} from "@ant-design/icons";

import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import "./LearningCenter.css";

export default function LearningCenter() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [recordLoading, setRecordLoading] = useState(false);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);

  // Evaluation & Recommendation stats (Feature #9 and #10)
  const [evalStatsLoading, setEvalStatsLoading] = useState(false);
  const [evalStats, setEvalStats] = useState<ChatEvaluationStats | null>(null);
  const [recommendStatsLoading, setRecommendStatsLoading] = useState(false);
  const [recommendStats, setRecommendStats] = useState<RecommendStats | null>(null);
  const [recommendCourseClicks, setRecommendCourseClicks] = useState<RecommendCourseClick[]>([]);
  const [recommendCoursesLoading, setRecommendCoursesLoading] = useState(false);

  const [records, setRecords] = useState<LearningRecord[]>([]);
  const [favorites, setFavorites] = useState<Course[]>([]);
  const [analysis, setAnalysis] = useState<LearningAnalysis | null>(null);
  const [report, setReport] = useState<LearningReport | null>(null);

  const loadRecords = useCallback(async () => {
    setRecordLoading(true);
    try {
      const res = await request.get<ApiResponse<LearningRecord[]>>(
        "/learning/record/list"
      );
      setRecords(res.data.data || []);
    } finally {
      setRecordLoading(false);
    }
  }, []);

  const loadFavorites = useCallback(async () => {
    setFavoriteLoading(true);
    try {
      const res = await request.get<ApiResponse<Course[]>>(
        "/learning/favorite/list"
      );
      setFavorites(res.data.data || []);
    } finally {
      setFavoriteLoading(false);
    }
  }, []);

  const loadAnalysis = useCallback(async () => {
    setAnalysisLoading(true);
    try {
      const res = await request.get<ApiResponse<LearningAnalysis>>(
        "/learning/analysis"
      );
      setAnalysis(res.data.data || null);
    } finally {
      setAnalysisLoading(false);
    }
  }, []);

  const loadReport = useCallback(async () => {
    setReportLoading(true);
    try {
      const res = await request.get<ApiResponse<LearningReport>>(
        "/learning/report"
      );
      setReport(res.data.data || null);
    } finally {
      setReportLoading(false);
    }
  }, []);

  // Load chat evaluation stats
  const loadEvalStats = useCallback(async () => {
    setEvalStatsLoading(true);
    try {
      const res = await request.get<ApiResponse<ChatEvaluationStats>>(
        "/evaluation/stats"
      );
      setEvalStats(res.data.data || null);
    } catch {
      setEvalStats(null);
    } finally {
      setEvalStatsLoading(false);
    }
  }, []);

  // Load recommendation stats (teacher/admin only)
  const loadRecommendStats = useCallback(async () => {
    setRecommendStatsLoading(true);
    try {
      const res = await request.get<ApiResponse<RecommendStats>>(
        "/recommend/stats"
      );
      setRecommendStats(res.data.data || null);
    } catch {
      setRecommendStats(null);
    } finally {
      setRecommendStatsLoading(false);
    }
  }, []);

  // Load recommendation course click counts
  const loadRecommendCourseClicks = useCallback(async () => {
    setRecommendCoursesLoading(true);
    try {
      const res = await request.get<ApiResponse<RecommendCourseClick[]>>(
        "/recommend/stats/courses",
        { params: { limit: 10 } }
      );
      setRecommendCourseClicks(res.data.data || []);
    } catch {
      setRecommendCourseClicks([]);
    } finally {
      setRecommendCoursesLoading(false);
    }
  }, []);

  const userRole = user?.roleType?.toLowerCase?.() || "";
  const isTeacherOrAdmin = userRole === "teacher" || userRole === "admin";

  useEffect(() => {
    if (!user) return;
    loadRecords();
    loadFavorites();
    loadAnalysis();
    loadReport();
    loadEvalStats();
    if (isTeacherOrAdmin) {
      loadRecommendStats();
      loadRecommendCourseClicks();
    }
  }, [user, loadAnalysis, loadFavorites, loadRecords, loadReport, loadEvalStats, loadRecommendStats, loadRecommendCourseClicks, isTeacherOrAdmin]);

  const recordList = useMemo(() => {
    return records.map((record) => {
      const progress = record.progressPercent ?? 0;
      return {
        ...record,
        progress,
      };
    });
  }, [records]);

  if (!user) {
    return (
      <div className="learning-center-page">
        <Header />
        <div className="learning-center-empty">
          <Empty description="请先登录后查看学习中心" />
          <Button type="primary" onClick={() => navigate("/login")}>登录</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="learning-center-page">
      <Header />
      <div className="learning-center-container">
        <Tabs
          defaultActiveKey="records"
          items={[
            {
              key: "records",
              label: "学习记录",
              children: (
                <Card className="learning-card" bordered={false}>
                  {recordLoading ? (
                    <div className="learning-loading">
                      <Spin size="large" />
                    </div>
                  ) : recordList.length === 0 ? (
                    <Empty description="暂无学习记录" />
                  ) : (
                    <List
                      itemLayout="vertical"
                      dataSource={recordList}
                      renderItem={(item) => (
                        <List.Item
                          key={item.id}
                          actions={[
                            <Button
                              key="continue"
                              type="primary"
                              onClick={() => navigate(`/courses/${item.courseId}`)}
                            >
                              继续学习
                            </Button>,
                          ]}
                        >
                          <List.Item.Meta
                            title={item.courseTitle || `课程 ${item.courseId}`}
                            description={`最近学习：${
                              item.lastLearningTime || "-"
                            }`}
                          />
                          <div className="learning-progress">
                            <Progress percent={item.progress} />
                          </div>
                        </List.Item>
                      )}
                    />
                  )}
                </Card>
              ),
            },
            {
              key: "favorites",
              label: "课程收藏",
              children: (
                <Card className="learning-card" bordered={false}>
                  {favoriteLoading ? (
                    <div className="learning-loading">
                      <Spin size="large" />
                    </div>
                  ) : favorites.length === 0 ? (
                    <Empty description="暂无收藏课程" />
                  ) : (
                    <div className="learning-course-grid">
                      {favorites.map((course) => {
                        const tags = course.tags
                          ? course.tags.split(",").filter(Boolean)
                          : [];
                        return (
                          <Card
                            key={course.id}
                            className="learning-course-card"
                            cover={
                              course.coverUrl ? (
                                <img src={course.coverUrl} alt={course.title} />
                              ) : null
                            }
                            onClick={() => navigate(`/courses/${course.id}`)}
                          >
                            <div className="course-title">{course.title}</div>
                            <div className="course-desc">{course.description}</div>
                            <div className="course-meta">
                              {course.category && (
                                <Tag color="blue">{course.category}</Tag>
                              )}
                              {tags.map((tag) => (
                                <Tag key={tag}>{tag}</Tag>
                              ))}
                            </div>
                          </Card>
                        );
                      })}
                    </div>
                  )}
                </Card>
              ),
            },
            {
              key: "analysis",
              label: "学习分析",
              children: (
                <div className="learning-grid">
                  <Card className="learning-card" bordered={false}>
                    {analysisLoading ? (
                      <div className="learning-loading">
                        <Spin size="large" />
                      </div>
                    ) : !analysis ? (
                      <Empty description="暂无学习分析" />
                    ) : (
                      <Row gutter={[24, 24]}>
                        <Col xs={24} md={12} lg={6}>
                          <Statistic
                            title="累计学习时长（小时）"
                            value={analysis.totalStudySeconds ? (analysis.totalStudySeconds / 3600).toFixed(2) : 0}
                          />
                        </Col>
                        <Col xs={24} md={12} lg={6}>
                          <Statistic
                            title="近30天学习天数"
                            value={analysis.activeDaysLast30 || 0}
                          />
                        </Col>
                        <Col xs={24} md={12} lg={6}>
                          <Statistic
                            title="学习课程数"
                            value={analysis.learningCourseCount || 0}
                          />
                        </Col>
                        <Col xs={24} md={12} lg={6}>
                          <Statistic
                            title="偏好分类"
                            value={analysis.topCategory || "-"}
                          />
                        </Col>
                        <Col xs={24} md={12} lg={6}>
                          <Statistic
                            title="偏好标签"
                            value={analysis.topTag || "-"}
                          />
                        </Col>
                      </Row>
                    )}
                  </Card>
                </div>
              ),
            },
            {
              key: "report",
              label: "学习报告",
              children: (
                <Card className="learning-card" bordered={false}>
                  {reportLoading ? (
                    <div className="learning-loading">
                      <Spin size="large" />
                    </div>
                  ) : !report ? (
                    <Empty description="暂无学习报告" />
                  ) : (
                    <Row gutter={[24, 24]}>
                      <Col xs={24} md={12} lg={6}>
                        <Statistic
                          title="累计学习时长（小时）"
                          value={report.totalStudySeconds ? (report.totalStudySeconds / 3600).toFixed(2) : 0}
                        />
                      </Col>
                      <Col xs={24} md={12} lg={6}>
                        <Statistic
                          title="学习课程数"
                          value={report.learningCourseCount || 0}
                        />
                      </Col>
                      <Col xs={24} md={12} lg={6}>
                        <Statistic
                          title="收藏课程数"
                          value={report.favoriteCourseCount || 0}
                        />
                      </Col>
                      <Col xs={24} md={12} lg={6}>
                        <Statistic
                          title="最近学习时间"
                          value={report.lastLearningTime || "-"}
                        />
                      </Col>
                      <Col xs={24} md={12} lg={6}>
                        <Statistic
                          title="偏好分类"
                          value={report.topCategory || "-"}
                        />
                      </Col>
                      <Col xs={24} md={12} lg={6}>
                        <Statistic
                          title="偏好标签"
                          value={report.topTag || "-"}
                        />
                      </Col>
                    </Row>
                  )}
                </Card>
              ),
            },
            {
              key: "eval-stats",
              label: "AI问答评价",
              children: (
                <Card className="learning-card" bordered={false}>
                  {evalStatsLoading ? (
                    <div className="learning-loading">
                      <Spin size="large" />
                    </div>
                  ) : !evalStats || evalStats.totalCount === 0 ? (
                    <Empty description="暂无AI问答评价数据" />
                  ) : (
                    <>
                      <h3 style={{ marginBottom: 16 }}>LLM 问答效果评价统计</h3>
                      <Row gutter={[24, 24]}>
                        <Col xs={24} md={12} lg={6}>
                          <Statistic
                            title="总评价数"
                            value={evalStats.totalCount || 0}
                            prefix={<BarChartOutlined />}
                          />
                        </Col>
                        <Col xs={24} md={12} lg={6}>
                          <Statistic
                            title="点赞数"
                            value={evalStats.thumbsUpCount || 0}
                            prefix={<LikeOutlined style={{ color: "#52c41a" }} />}
                            valueStyle={{ color: "#52c41a" }}
                          />
                        </Col>
                        <Col xs={24} md={12} lg={6}>
                          <Statistic
                            title="点踩数"
                            value={evalStats.thumbsDownCount || 0}
                            prefix={<DislikeOutlined style={{ color: "#ff4d4f" }} />}
                            valueStyle={{ color: "#ff4d4f" }}
                          />
                        </Col>
                        <Col xs={24} md={12} lg={6}>
                          <Statistic
                            title="满意率"
                            value={evalStats.satisfactionRate != null ? `${evalStats.satisfactionRate}%` : "-"}
                            valueStyle={{
                              color: evalStats.satisfactionRate != null && evalStats.satisfactionRate >= 70
                                ? "#52c41a" : evalStats.satisfactionRate != null && evalStats.satisfactionRate >= 40
                                  ? "#faad14" : "#ff4d4f",
                            }}
                          />
                        </Col>
                        <Col xs={24} md={12} lg={6}>
                          <Statistic
                            title="平均星级评分"
                            value={evalStats.averageRating != null ? evalStats.averageRating : "-"}
                            prefix={<StarOutlined style={{ color: "#faad14" }} />}
                            suffix={evalStats.averageRating != null ? " / 5" : ""}
                          />
                        </Col>
                        <Col xs={24} md={12} lg={6}>
                          <Statistic
                            title="已评分数"
                            value={evalStats.ratedCount || 0}
                          />
                        </Col>
                      </Row>
                      <Divider />
                      <div>
                        <h4>满意率说明</h4>
                        <p style={{ color: "#718096", fontSize: 13 }}>
                          满意率 = 点赞数 / (点赞数 + 点踩数) × 100%。
                          平均评分基于用户提交的 1-5 星评价计算。
                        </p>
                      </div>
                    </>
                  )}
                </Card>
              ),
            },
            // Teacher/Admin: Recommendation Performance tab
            ...(isTeacherOrAdmin
              ? [
                  {
                    key: "recommend-stats",
                    label: "推荐效果评价",
                    children: (
                      <Card className="learning-card" bordered={false}>
                        {recommendStatsLoading ? (
                          <div className="learning-loading">
                            <Spin size="large" />
                          </div>
                        ) : !recommendStats ? (
                          <Empty description="暂无推荐统计数据" />
                        ) : (
                          <>
                            <h3 style={{ marginBottom: 16 }}>个性化推荐性能评价</h3>
                            <Row gutter={[24, 24]}>
                              <Col xs={24} md={12} lg={6}>
                                <Statistic
                                  title="总点击数"
                                  value={recommendStats.totalClicks || 0}
                                  prefix={<BarChartOutlined />}
                                />
                              </Col>
                              <Col xs={24} md={12} lg={6}>
                                <Statistic
                                  title="点击用户数"
                                  value={recommendStats.clickedUsers || 0}
                                />
                              </Col>
                              {recommendStats.topClickedCourseTitle && (
                                <Col xs={24} md={12} lg={6}>
                                  <Statistic
                                    title="最热门推荐课程"
                                    value={recommendStats.topClickedCourseTitle}
                                  />
                                </Col>
                              )}
                              {recommendStats.topClickedCount != null && (
                                <Col xs={24} md={12} lg={6}>
                                  <Statistic
                                    title="最热门课程点击数"
                                    value={recommendStats.topClickedCount}
                                  />
                                </Col>
                              )}
                            </Row>
                            <Divider />
                            <h4>推荐课程点击排行</h4>
                            {recommendCoursesLoading ? (
                              <Spin />
                            ) : recommendCourseClicks.length === 0 ? (
                              <Empty description="暂无点击数据" />
                            ) : (
                              <Table
                                dataSource={recommendCourseClicks}
                                rowKey="courseId"
                                pagination={false}
                                size="small"
                                columns={[
                                  {
                                    title: "课程ID",
                                    dataIndex: "courseId",
                                    key: "courseId",
                                    width: 80,
                                  },
                                  {
                                    title: "课程名称",
                                    dataIndex: "courseTitle",
                                    key: "courseTitle",
                                    render: (text: string) => text || "-",
                                  },
                                  {
                                    title: "点击次数",
                                    dataIndex: "clickCount",
                                    key: "clickCount",
                                    width: 100,
                                    sorter: (a: RecommendCourseClick, b: RecommendCourseClick) =>
                                      a.clickCount - b.clickCount,
                                    defaultSortOrder: "descend" as const,
                                  },
                                ]}
                              />
                            )}
                            <Divider />
                            <div>
                              <h4>指标说明</h4>
                              <p style={{ color: "#718096", fontSize: 13 }}>
                                点击率 (CTR) = 推荐课程点击数 / 推荐展示次数 × 100%。
                                当前统计基于用户实际点击推荐课程的行为数据。
                                点击排行展示被推荐课程的点击次数，可用于评估推荐算法的有效性。
                              </p>
                            </div>
                          </>
                        )}
                      </Card>
                    ),
                  },
                ]
              : []),
          ]}
        />
      </div>
    </div>
  );
}
