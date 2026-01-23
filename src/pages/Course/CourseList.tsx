import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../../components/Header";
import { Card, Select, Radio, Tag } from "antd";
import { ClockCircleOutlined, TagsOutlined } from "@ant-design/icons";
import type { Course } from "../../types/api";
import { mockCourses } from "../../data/mockCourses";
import "./CourseList.css";

type SortType = "latest" | "earliest";

export default function CourseList() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);
  const [sortType, setSortType] = useState<SortType>("latest");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [allTags, setAllTags] = useState<string[]>([]);

  useEffect(() => {
    // 使用 mock 数据
    setCourses(mockCourses);
    
    // 提取所有标签
    const tagsSet = new Set<string>();
    mockCourses.forEach((course) => {
      course.tags.split(",").forEach((tag) => tagsSet.add(tag.trim()));
    });
    setAllTags(Array.from(tagsSet));

    // 未来对接后端接口
    // request.get<ApiResponse<Course[]>>("/course/list").then((res) => {
    //   setCourses(res.data.data || []);
    // });
  }, []);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  const handleCourseClick = (courseId: number) => {
    navigate(`/course/${courseId}`);
  };

  return (
    <div className="course-list-wrapper">
      <Header />
      <div className="course-list-container">
        {/* 筛选区域 */}
        <Card className="filter-card" bordered={false}>
          <div className="filter-content">
            <div className="filter-item">
              <span className="filter-label">
                <ClockCircleOutlined /> 排序：
              </span>
              <Radio.Group
                value={sortType}
                onChange={(e) => setSortType(e.target.value)}
                buttonStyle="solid"
              >
                <Radio.Button value="latest">最新</Radio.Button>
                <Radio.Button value="earliest">最早</Radio.Button>
              </Radio.Group>
            </div>

            <div className="filter-item">
              <span className="filter-label">
                <TagsOutlined /> 标签：
              </span>
              <Select
                mode="multiple"
                placeholder="选择标签筛选"
                value={selectedTags}
                onChange={setSelectedTags}
                style={{ minWidth: 200 }}
                options={allTags.map((tag) => ({ label: tag, value: tag }))}
              />
            </div>
          </div>
        </Card>

        {/* 课程网格 */}
        <div className="course-grid">
          {courses.map((course) => (
            <Card
              key={course.id}
              className="course-card"
              bordered={false}
              hoverable
              onClick={() => handleCourseClick(course.id)}
            >
              <div className="course-card-header" />
              <div className="course-card-body">
                <h3 className="course-title">{course.title}</h3>
                <p className="course-description">{course.description}</p>

                <div className="course-tags">
                  {course.tags.split(",").map((tag, index) => (
                    <Tag key={index} className="course-tag">
                      {tag.trim()}
                    </Tag>
                  ))}
                </div>

                <div className="course-footer">
                  <span className="course-time">
                    <ClockCircleOutlined />
                    {formatDate(course.updateTime)}
                  </span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
