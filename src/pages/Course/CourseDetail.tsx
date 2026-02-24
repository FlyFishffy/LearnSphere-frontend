import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Header from "../../components/Header";
import request from "../../api/request";
import type { ApiResponse, Course, LearningRecord } from "../../types/api";
import {
  Card,
  Spin,
  Tag,
  Empty,
  Button,
  Progress,
  InputNumber,
  Space,
  message as antdMessage,
} from "antd";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useAuth } from "../../hooks/useAuth";
import "./CourseDetail.css";



export default function CourseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [recordLoading, setRecordLoading] = useState<boolean>(false);
  const [favoriteLoading, setFavoriteLoading] = useState<boolean>(false);
  const [recordSaving, setRecordSaving] = useState<boolean>(false);
  const [record, setRecord] = useState<LearningRecord | null>(null);
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [studySecondsIncrement, setStudySecondsIncrement] = useState<number>(0);
  const [isFavorite, setIsFavorite] = useState<boolean>(false);



  useEffect(() => {
    if (!id) return;
    setLoading(true);
    request
      .get<ApiResponse<Course>>(`/course/get/${id}`)
      .then((res) => {
        setCourse(res.data.data || null);
      })
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!user || !id) return;
    const courseId = Number(id);
    setRecordLoading(true);
    setFavoriteLoading(true);
    Promise.all([
      request.get<ApiResponse<LearningRecord[]>>("/learning/record/list"),
      request.get<ApiResponse<Course[]>>("/learning/favorite/list"),
    ])
      .then(([recordRes, favoriteRes]) => {
        const recordList = recordRes.data.data || [];
        const targetRecord = recordList.find(
          (item) => item.courseId === courseId
        );
        setRecord(targetRecord || null);
        setProgressPercent(targetRecord?.progressPercent ?? 0);

        const favoriteList = favoriteRes.data.data || [];
        setIsFavorite(favoriteList.some((item) => item.id === courseId));
      })
      .finally(() => {
        setRecordLoading(false);
        setFavoriteLoading(false);
      });
  }, [id, user]);


  if (loading) {
    return (
      <div className="course-detail-page">
        <Header />
        <div className="course-detail-loading">
          <Spin size="large" />
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="course-detail-page">
        <Header />
        <div className="course-detail-empty">
          <Empty description="课程不存在或已删除" />
        </div>
      </div>
    );
  }

  const tags = course.tags ? course.tags.split(",").filter(Boolean) : [];

  const handleToggleFavorite = async () => {
    if (!user) {
      antdMessage.warning("请先登录");
      navigate("/login");
      return;
    }
    if (!course) return;
    setFavoriteLoading(true);
    try {
      if (isFavorite) {
        await request.delete(`/learning/favorite/${course.id}`);
        setIsFavorite(false);
        antdMessage.success("已取消收藏");
      } else {
        await request.post(`/learning/favorite/${course.id}`);
        setIsFavorite(true);
        antdMessage.success("已加入收藏");
      }
    } finally {
      setFavoriteLoading(false);
    }
  };

  const handleSaveRecord = async () => {
    if (!user) {
      antdMessage.warning("请先登录");
      navigate("/login");
      return;
    }
    if (!course) return;
    setRecordSaving(true);
    try {
      await request.post("/learning/record/update", {
        courseId: course.id,
        progressPercent,
        studySecondsIncrement:
          studySecondsIncrement > 0 ? studySecondsIncrement : undefined,
      });
      antdMessage.success("学习记录已更新");
      setRecord((prev) => ({
        id: prev?.id || 0,
        userId: prev?.userId || 0,
        courseId: course.id,
        progressPercent,
        totalStudySeconds:
          (prev?.totalStudySeconds || 0) + (studySecondsIncrement || 0),
        lastLearningTime: new Date().toISOString(),
      }));
      setStudySecondsIncrement(0);
    } finally {
      setRecordSaving(false);
    }
  };

  return (

    <div className="course-detail-page">
      <Header />
      <div className="course-detail-container">
        <Card className="course-detail-card" bordered={false}>
          <div className="course-detail-header">
            <div>
              <h1 className="course-detail-title">{course.title}</h1>
              <div className="course-detail-meta">
                {course.category && <Tag color="blue">{course.category}</Tag>}
                {tags.map((tag) => (
                  <Tag key={tag}>{tag}</Tag>
                ))}
              </div>
            </div>
            <div className="course-detail-actions">
              {user && ["Teacher", "Admin"].includes(user.roleType) && (
                <Button
                  type="primary"
                  onClick={() => navigate(`/courses/edit/${course.id}`)}
                >
                  编辑课程
                </Button>
              )}
              {course.coverUrl && (
                <img
                  className="course-detail-cover"
                  src={course.coverUrl}
                  alt={course.title}
                />
              )}
            </div>
          </div>


          {course.description && (
            <div className="course-detail-desc">{course.description}</div>
          )}

          <div className="course-detail-learning">
            <div className="learning-panel">
              <div className="learning-panel-title">学习进度</div>
              <Progress percent={progressPercent} />
              <div className="learning-panel-meta">
                最近学习：{record?.lastLearningTime || "-"}
              </div>
              <Space wrap>
                <InputNumber
                  min={0}
                  max={100}
                  value={progressPercent}
                  onChange={(value) =>
                    setProgressPercent(typeof value === "number" ? value : 0)
                  }
                  placeholder="进度(%)"
                />
                <InputNumber
                  min={0}
                  value={studySecondsIncrement}
                  onChange={(value) =>
                    setStudySecondsIncrement(typeof value === "number" ? value : 0)
                  }
                  placeholder="本次学习时长(秒)"
                />
                <Button
                  type="primary"
                  loading={recordSaving}
                  onClick={handleSaveRecord}
                >
                  保存学习记录
                </Button>
              </Space>
              {recordLoading && <div className="learning-panel-hint">加载中...</div>}
            </div>

            <div className="learning-panel">
              <div className="learning-panel-title">课程收藏</div>
              <div className="learning-panel-meta">
                累计学习时长：{record?.totalStudySeconds || 0} 秒
              </div>
              <Button
                type={isFavorite ? "default" : "primary"}
                loading={favoriteLoading}
                onClick={handleToggleFavorite}
              >
                {isFavorite ? "取消收藏" : "收藏课程"}
              </Button>
            </div>
          </div>

          <div className="course-detail-content">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {course.contentMd || "暂无课程内容"}
            </ReactMarkdown>
          </div>

        </Card>
      </div>
    </div>
  );
}
