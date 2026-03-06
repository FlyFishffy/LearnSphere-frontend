import { useCallback, useEffect, useMemo, useState } from "react";
import Header from "../../components/Header";
import request from "../../api/request";
import type {
  ApiResponse,
  Course,
  LearningAnalysis,
  LearningRecord,
  LearningReport,
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
} from "antd";

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

  useEffect(() => {
    if (!user) return;
    loadRecords();
    loadFavorites();
    loadAnalysis();
    loadReport();
  }, [user, loadAnalysis, loadFavorites, loadRecords, loadReport]);

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
                            title={`课程ID：${item.courseId}`}
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
                            title="累计学习时长（秒）"
                            value={analysis.totalStudySeconds || 0}
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
                          title="累计学习时长（秒）"
                          value={report.totalStudySeconds || 0}
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
          ]}
        />
      </div>
    </div>
  );
}
