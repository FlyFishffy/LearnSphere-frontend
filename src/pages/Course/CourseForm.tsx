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
  Upload,
  Progress,
} from "antd";
import { UploadOutlined, VideoCameraOutlined, DeleteOutlined, PictureOutlined } from "@ant-design/icons";
import Header from "../../components/Header";
import request from "../../api/request";
import type { ApiResponse, Course } from "../../types/api";
import { useAuth } from "../../hooks/useAuth";
import "./CourseForm.css";

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

const categoryDescToValue: Record<string, number> = {
  COMPUTER_SCIENCE: 1,
  ARTIFICIAL_INTELLIGENCE: 2,
  CYBER_SECURITY: 3,
  SOFTWARE_ENGINEERING: 4,
  ELECTRONIC_ENGINEERING: 5,
  MATH_AND_FOUNDATION: 6,
};

const tagDescToValue: Record<string, number> = {
  "数据结构与算法": 1,
  "操作系统": 2,
  "计算机网络": 3,
  "编译原理": 4,
  "数据库系统": 5,
  "机器学习": 6,
  "信息安全": 7,
  "计算机体系结构": 8,
  "程序设计": 9,
  "信号处理": 10,
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
  const [videoUrl, setVideoUrl] = useState("");
  const [videoDuration, setVideoDuration] = useState<number | undefined>();
  const [videoUploading, setVideoUploading] = useState(false);
  const [videoUploadPercent, setVideoUploadPercent] = useState(0);
  const [imageUploading, setImageUploading] = useState(false);

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
        setVideoUrl(data.videoUrl || "");
        setVideoDuration(data.videoDuration ?? undefined);
      })
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  const handleImageUpload = async (file: File) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp", "image/bmp", "image/svg+xml"];
    if (!allowedTypes.includes(file.type) && !file.name.match(/\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i)) {
      antdMessage.error("不支持的图片格式，请上传 jpg/jpeg/png/gif/webp/bmp/svg 格式");
      return false;
    }
    if (file.size > 10 * 1024 * 1024) {
      antdMessage.error("图片文件不能超过 10MB");
      return false;
    }

    const formData = new FormData();
    formData.append("file", file);

    setImageUploading(true);
    try {
      const res = await request.post<ApiResponse<{ imageUrl: string; originalFilename: string }>>(
        "/file/upload/image",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      if (res.data.code === 200 && res.data.data) {
        setCoverUrl(res.data.data.imageUrl);
        antdMessage.success("封面图上传成功");
      } else {
        antdMessage.error(res.data.message || "上传失败");
      }
    } catch {
      antdMessage.error("图片上传失败，请重试");
    } finally {
      setImageUploading(false);
    }
    return false; // Prevent antd Upload default behavior
  };

  const handleVideoUpload = async (file: File) => {
    const allowedTypes = ["video/mp4", "video/webm", "video/ogg", "video/quicktime", "video/x-msvideo"];
    if (!allowedTypes.includes(file.type) && !file.name.match(/\.(mp4|webm|ogg|mov|avi|mkv)$/i)) {
      antdMessage.error("不支持的视频格式，请上传 mp4/webm/ogg/mov/avi/mkv 格式");
      return false;
    }
    if (file.size > 500 * 1024 * 1024) {
      antdMessage.error("视频文件不能超过 500MB");
      return false;
    }

    const formData = new FormData();
    formData.append("file", file);

    setVideoUploading(true);
    setVideoUploadPercent(0);

    try {
      const res = await request.post<ApiResponse<{ videoUrl: string; originalFilename: string }>>(
        "/file/upload/video",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total) {
              const percent = Math.round((progressEvent.loaded / progressEvent.total) * 100);
              setVideoUploadPercent(percent);
            }
          },
        }
      );
      if (res.data.code === 200 && res.data.data) {
        setVideoUrl(res.data.data.videoUrl);
        antdMessage.success("视频上传成功");

        // Try to get video duration
        const videoEl = document.createElement("video");
        videoEl.preload = "metadata";
        videoEl.src = res.data.data.videoUrl;
        videoEl.onloadedmetadata = () => {
          setVideoDuration(Math.round(videoEl.duration));
          URL.revokeObjectURL(videoEl.src);
        };
      } else {
        antdMessage.error(res.data.message || "上传失败");
      }
    } catch {
      antdMessage.error("视频上传失败，请重试");
    } finally {
      setVideoUploading(false);
    }
    return false; // Prevent antd Upload default behavior
  };

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
      videoUrl: videoUrl.trim() || undefined,
      videoDuration: videoDuration ?? undefined,
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
                <label>课程封面图</label>
                <div className="image-upload-section">
                  {coverUrl ? (
                    <div className="image-preview-box">
                      <img
                        src={coverUrl}
                        alt="封面预览"
                        className="image-preview"
                      />
                      <div className="image-preview-info">
                        <span><PictureOutlined /> 已设置封面图</span>
                        <Button
                          type="link"
                          danger
                          icon={<DeleteOutlined />}
                          onClick={() => setCoverUrl("")}
                        >
                          移除封面
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Upload
                      accept="image/jpeg,image/png,image/gif,image/webp,image/bmp,.svg"
                      showUploadList={false}
                      beforeUpload={handleImageUpload}
                      disabled={imageUploading}
                    >
                      <Button icon={<UploadOutlined />} loading={imageUploading}>
                        {imageUploading ? "上传中..." : "上传封面图片"}
                      </Button>
                    </Upload>
                  )}
                  <div className="image-upload-hint">
                    支持 jpg/jpeg/png/gif/webp/bmp/svg 格式，最大 10MB。也可以直接填写图片 URL：
                  </div>
                  <Input
                    placeholder="或直接输入图片 URL（如 https://...）"
                    value={coverUrl}
                    onChange={(e) => setCoverUrl(e.target.value)}
                    style={{ marginTop: 4 }}
                  />
                </div>
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
                <label>课程视频</label>
                <div className="video-upload-section">
                  {videoUrl ? (
                    <div className="video-preview-box">
                      <video
                        src={videoUrl}
                        controls
                        className="video-preview"
                        style={{ maxWidth: "100%", maxHeight: 240, borderRadius: 8 }}
                      />
                      <div className="video-preview-info">
                        <span>
                          <VideoCameraOutlined /> 已上传视频
                          {videoDuration ? ` (${Math.floor(videoDuration / 60)}分${videoDuration % 60}秒)` : ""}
                        </span>
                        <Button
                          type="link"
                          danger
                          icon={<DeleteOutlined />}
                          onClick={() => { setVideoUrl(""); setVideoDuration(undefined); }}
                        >
                          移除视频
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Upload
                      accept="video/mp4,video/webm,video/ogg,.mov,.avi,.mkv"
                      showUploadList={false}
                      beforeUpload={handleVideoUpload}
                      disabled={videoUploading}
                    >
                      <Button icon={<UploadOutlined />} loading={videoUploading}>
                        {videoUploading ? "上传中..." : "上传视频文件"}
                      </Button>
                    </Upload>
                  )}
                  {videoUploading && <Progress percent={videoUploadPercent} size="small" style={{ marginTop: 8 }} />}
                  <div className="video-upload-hint">
                    支持 mp4/webm/ogg/mov/avi/mkv 格式，最大 500MB。也可以直接填写视频 URL：
                  </div>
                  <Input
                    placeholder="或直接输入视频 URL（如 https://...）"
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    style={{ marginTop: 4 }}
                  />
                </div>
              </div>

              <div className="form-row">
                <label>课程内容（Markdown）</label>
                <Input.TextArea
                  placeholder="请输入 Markdown 内容（可选，视频课程可不填）"
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
