import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Card,
  Input,
  Select,
  Button,
  Tag,
  message as antdMessage,
  Empty,
  Spin,
} from "antd";
import Header from "../../components/Header";
import request from "../../api/request";
import type { ApiResponse, Course } from "../../types/api";
import { useAuth } from "../../hooks/useAuth";
import "./CourseForm.css";

const categoryOptions = [
  { label: "AI", value: 1 },
  { label: "后端", value: 2 },
  { label: "前端", value: 3 },
  { label: "计算机网络", value: 4 },
];

const tagOptions = [
  { label: "AI", value: 1 },
  { label: "Java", value: 2 },
  { label: "C++", value: 3 },
  { label: "Golang", value: 4 },
];

const categoryDescToValue: Record<string, number> = {
  AI: 1,
  BACKEND: 2,
  FRONTEND: 3,
  COMPUTER_NET: 4,
};

const tagDescToValue: Record<string, number> = {
  AI: 1,
  Java: 2,
  "C++": 3,
  Golang: 4,
};

export default function CourseForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [category, setCategory] = useState<number | undefined>();
  const [tags, setTags] = useState<number[]>([]);
  const [contentMd, setContentMd] = useState("");

  const canManage = useMemo(() => {
    return user && ["Teacher", "Admin"].includes(user.roleType);
  }, [user]);

  useEffect(() => {
    if (!isEdit || !id) return;
    setLoading(true);
    request
      .get<ApiResponse<Course>>(`/course/get/${id}`)
      .then((res) => {
        const data = res.data.data;
        if (!data) return;
        setTitle(data.title || "");
        setDescription(data.description || "");
        setCoverUrl(data.coverUrl || "");
        setCategory(data.category ? categoryDescToValue[data.category] : undefined);
        setTags(
          data.tags
            ? data.tags
                .split(",")
                .map((tag) => tagDescToValue[tag])
                .filter((v) => v !== undefined)
            : []
        );
        setContentMd(data.contentMd || "");
      })
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  const handleSubmit = async () => {
    if (!canManage) {
      antdMessage.warning("暂无权限");
      return;
    }
    if (!title.trim()) {
      antdMessage.warning("请输入课程标题");
      return;
    }
    if (!category) {
      antdMessage.warning("请选择课程分类");
      return;
    }
    if (!tags.length) {
      antdMessage.warning("请选择课程标签");
      return;
    }

    const payload = {
      id: isEdit ? Number(id) : undefined,
      title: title.trim(),
      description: description.trim(),
      coverUrl: coverUrl.trim() || undefined,
      category,
      tags,
      contentMd: contentMd.trim(),
    };

    try {
      setLoading(true);
      if (isEdit) {
        const res = await request.put<ApiResponse<boolean>>(
          "/course/update",
          payload
        );
        if (res.data.code === 200) {
          antdMessage.success("课程已更新");
          navigate(`/courses/${id}`);
        } else {
          antdMessage.error(res.data.message || "更新失败");
        }
      } else {
        const res = await request.post<ApiResponse<number>>(
          "/course/add",
          payload
        );
        if (res.data.code === 200) {
          antdMessage.success("课程已创建");
          navigate(`/courses/${res.data.data}`);
        } else {
          antdMessage.error(res.data.message || "创建失败");
        }
      }
    } finally {
      setLoading(false);
    }
  };

  if (!canManage) {
    return (
      <div className="course-form-page">
        <Header />
        <div className="course-form-empty">
          <Empty description="仅教师或管理员可操作课程" />
        </div>
      </div>
    );
  }

  return (
    <div className="course-form-page">
      <Header />
      <div className="course-form-container">
        <Card className="course-form-card" bordered={false}>
          <div className="course-form-header">
            <h1>{isEdit ? "编辑课程" : "新增课程"}</h1>
            <Tag color={isEdit ? "blue" : "green"}>
              {isEdit ? "编辑" : "新增"}
            </Tag>
          </div>

          {loading ? (
            <div className="course-form-loading">
              <Spin size="large" />
            </div>
          ) : (
            <div className="course-form-body">
              <div className="form-row">
                <label>课程标题</label>
                <Input
                  placeholder="请输入课程标题"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div className="form-row">
                <label>课程简介</label>
                <Input.TextArea
                  placeholder="请输入课程简介"
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className="form-row">
                <label>封面图 URL</label>
                <Input
                  placeholder="https://..."
                  value={coverUrl}
                  onChange={(e) => setCoverUrl(e.target.value)}
                />
              </div>

              <div className="form-row form-row-inline">
                <div>
                  <label>课程分类</label>
                  <Select
                    placeholder="请选择分类"
                    options={categoryOptions}
                    value={category}
                    onChange={(value) => setCategory(value)}
                  />
                </div>
                <div>
                  <label>课程标签</label>
                  <Select
                    mode="multiple"
                    placeholder="请选择标签"
                    options={tagOptions}
                    value={tags}
                    onChange={(value) => setTags(value)}
                  />
                </div>
              </div>

              <div className="form-row">
                <label>课程内容（Markdown）</label>
                <Input.TextArea
                  placeholder="请输入 Markdown 内容"
                  rows={12}
                  value={contentMd}
                  onChange={(e) => setContentMd(e.target.value)}
                />
              </div>

              <div className="form-actions">
                <Button onClick={() => navigate(-1)}>取消</Button>
                <Button type="primary" onClick={handleSubmit} loading={loading}>
                  {isEdit ? "保存修改" : "创建课程"}
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
