import { useEffect, useMemo, useState } from "react";
import Header from "../../components/Header";
import request from "../../api/request";
import { Card, Input, Select, Tag, Empty, Spin, Button } from "antd";
import type { ApiResponse, Course } from "../../types/api";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

import "./CourseList.css";


const categoryOptions = [
  { label: "计算机科学", value: 1 },
  { label: "人工智能", value: 2 },
  { label: "网络安全", value: 3 },
  { label: "软件工程", value: 4 },
  { label: "电子工程", value: 5 },
  { label: "数学基础", value: 6 },
];

const tagOptions = [
  { label: "数据结构与算法", value: 1 },
  { label: "操作系统", value: 2 },
  { label: "计算机网络", value: 3 },
  { label: "编译原理", value: 4 },
  { label: "数据库系统", value: 5 },
  { label: "机器学习", value: 6 },
  { label: "信息安全", value: 7 },
  { label: "计算机体系结构", value: 8 },
  { label: "程序设计", value: 9 },
  { label: "信号处理", value: 10 },
];

export default function CourseList() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [keyword, setKeyword] = useState<string>("");
  const navigate = useNavigate();
  const { user } = useAuth();

  const [category, setCategory] = useState<number | undefined>();

  const [tag, setTag] = useState<number | undefined>();
  const [loading, setLoading] = useState<boolean>(false);

  const params = useMemo(() => {
    const next: Record<string, string | number> = {};
    if (keyword.trim()) next.keyword = keyword.trim();
    if (category !== undefined) next.category = category;
    if (tag !== undefined) next.tag = tag;
    return next;
  }, [keyword, category, tag]);

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const res = await request.get<ApiResponse<Course[]>>("/course/list", {
        params,
      });
      setCourses(res.data.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="course-list-page">
      <Header />

      <div className="course-filter">
        <Input
          placeholder="搜索课程标题/简介"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          allowClear
        />
        <Button
          type="primary"
          onClick={() => navigate("/courses/new")}
          disabled={!user || !["Teacher", "Admin"].includes(user.roleType)}
        >
          新增课程
        </Button>

        <Select
          placeholder="分类"
          options={categoryOptions}
          value={category}
          onChange={(value) => setCategory(value)}
          allowClear
        />
        <Select
          placeholder="标签"
          options={tagOptions}
          value={tag}
          onChange={(value) => setTag(value)}
          allowClear
        />
        <Button type="primary" onClick={fetchCourses}>
          搜索
        </Button>
        <Button
          onClick={() => {
            setKeyword("");
            setCategory(undefined);
            setTag(undefined);
            setTimeout(fetchCourses, 0);
          }}
        >
          重置
        </Button>
      </div>

      <div className="course-grid">
        {loading ? (
          <div className="course-loading">
            <Spin size="large" />
          </div>
        ) : courses.length === 0 ? (
          <Empty description="暂无课程" />
        ) : (
          courses.map((course) => {
            const tags = course.tags
              ? course.tags.split(",").filter(Boolean)
              : [];
            return (
              <Card
                key={course.id}
                className="course-card"
                cover={
                  course.coverUrl ? (
                    <img src={course.coverUrl} alt={course.title} />
                  ) : null
                }
                onClick={() => navigate(`/courses/${course.id}`)}
                role="button"
                tabIndex={0}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    navigate(`/courses/${course.id}`);
                  }
                }}
              >

                <div className="course-title">{course.title}</div>
                <div className="course-desc">{course.description}</div>
                <div className="course-meta">
                  {course.category && (
                    <Tag color="blue">{course.category}</Tag>
                  )}
                  {tags.map((t) => (
                    <Tag key={t}>{t}</Tag>
                  ))}
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}

