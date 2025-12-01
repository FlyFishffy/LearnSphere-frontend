import { useEffect, useState } from "react";
import Header from "../../components/Header";
import request from "../../api/request";
import { Card } from "antd";
import type { ApiResponse, Course } from "../../types/api";

export default function CourseList() {
  const [courses, setCourses] = useState<Course[]>([]);

  useEffect(() => {
    request.get<ApiResponse<Course[]>>("/course/list").then((res) => {
      setCourses(res.data.data || []);
    });
  }, []);

  return (
    <div>
      <Header />
      <div
        style={{
          padding: 40,
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 20,
        }}
      >
        {courses.map((course) => (
          <Card key={course.id} title={course.title}>
            {course.description}
          </Card>
        ))}
      </div>
    </div>
  );
}
