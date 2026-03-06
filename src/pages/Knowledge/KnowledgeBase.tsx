import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Header from "../../components/Header";
import request from "../../api/request";
import type {
  ApiResponse,
  Course,
  ChunkVO,
  KnowledgeIndexStatusVO,
} from "../../types/api";
import { useAuth } from "../../hooks/useAuth";
import {
  Card,
  Button,
  Table,
  Tag,
  Space,
  message as antdMessage,
  Spin,
  Empty,
  Upload,
  Modal,
  Input,
  Popconfirm,
  Statistic,
  Progress,
  Tooltip,
} from "antd";
import {
  UploadOutlined,
  ReloadOutlined,
  DeleteOutlined,
  PlusOutlined,
  EditOutlined,
  DatabaseOutlined,
  FileTextOutlined,
  ArrowLeftOutlined,
} from "@ant-design/icons";
import type { UploadProps } from "antd";
import "./KnowledgeBase.css";

export default function KnowledgeBase() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const numericCourseId = courseId ? Number(courseId) : null;

  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<KnowledgeIndexStatusVO | null>(null);
  const [chunks, setChunks] = useState<ChunkVO[]>([]);
  const [chunksLoading, setChunksLoading] = useState(false);
  const [indexBuilding, setIndexBuilding] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Modal state for add/edit chunk
  const [chunkModalOpen, setChunkModalOpen] = useState(false);
  const [editingChunk, setEditingChunk] = useState<ChunkVO | null>(null);
  const [chunkText, setChunkText] = useState("");
  const [chunkHeading, setChunkHeading] = useState("");
  const [chunkSaving, setChunkSaving] = useState(false);

  const canManage = useMemo(
    () => user && ["Teacher", "Admin"].includes(user.roleType),
    [user]
  );

  // Fetch course info
  useEffect(() => {
    if (!numericCourseId) return;
    setLoading(true);
    request
      .get<ApiResponse<Course>>(`/course/get/${numericCourseId}`)
      .then((res) => setCourse(res.data.data || null))
      .finally(() => setLoading(false));
  }, [numericCourseId]);

  // Fetch index status
  const fetchStatus = useCallback(() => {
    if (!numericCourseId) return;
    request
      .get<ApiResponse<KnowledgeIndexStatusVO>>(
        `/rag/status/${numericCourseId}`
      )
      .then((res) => setStatus(res.data.data || null));
  }, [numericCourseId]);

  // Fetch chunks
  const fetchChunks = useCallback(() => {
    if (!numericCourseId) return;
    setChunksLoading(true);
    request
      .get<ApiResponse<ChunkVO[]>>(`/rag/chunks/${numericCourseId}`)
      .then((res) => setChunks(res.data.data || []))
      .finally(() => setChunksLoading(false));
  }, [numericCourseId]);

  useEffect(() => {
    fetchStatus();
    fetchChunks();
  }, [fetchStatus, fetchChunks]);

  // Build index from course markdown
  const handleBuildIndex = async () => {
    if (!numericCourseId) return;
    setIndexBuilding(true);
    try {
      const res = await request.post<ApiResponse<boolean>>(
        `/rag/index/${numericCourseId}`
      );
      if (res.data.code === 200) {
        antdMessage.success("知识库索引构建成功");
        fetchStatus();
        fetchChunks();
      } else {
        antdMessage.error(res.data.message || "构建失败");
      }
    } catch {
      antdMessage.error("构建索引失败");
    } finally {
      setIndexBuilding(false);
    }
  };

  // Delete all index
  const handleDeleteIndex = async () => {
    if (!numericCourseId) return;
    try {
      const res = await request.delete<ApiResponse<boolean>>(
        `/rag/index/${numericCourseId}`
      );
      if (res.data.code === 200) {
        antdMessage.success("知识库索引已删除");
        fetchStatus();
        fetchChunks();
      } else {
        antdMessage.error(res.data.message || "删除失败");
      }
    } catch {
      antdMessage.error("删除索引失败");
    }
  };

  // Upload document
  const uploadProps: UploadProps = {
    name: "file",
    action: `/api/rag/upload/${numericCourseId}`,
    withCredentials: true,
    accept: ".pdf,.docx,.txt,.md",
    showUploadList: false,
    beforeUpload: () => {
      setUploading(true);
      return true;
    },
    onChange(info) {
      if (info.file.status === "done") {
        setUploading(false);
        const resp = info.file.response;
        if (resp && resp.code === 200) {
          antdMessage.success(`${info.file.name} 解析并索引成功`);
          fetchStatus();
          fetchChunks();
        } else {
          antdMessage.error(resp?.message || "上传失败");
        }
      } else if (info.file.status === "error") {
        setUploading(false);
        antdMessage.error(`${info.file.name} 上传失败`);
      }
    },
  };

  // Open modal to add chunk
  const handleOpenAddChunk = () => {
    setEditingChunk(null);
    setChunkText("");
    setChunkHeading("");
    setChunkModalOpen(true);
  };

  // Open modal to edit chunk
  const handleOpenEditChunk = (chunk: ChunkVO) => {
    setEditingChunk(chunk);
    setChunkText(chunk.text);
    setChunkHeading(chunk.heading || "");
    setChunkModalOpen(true);
  };

  // Save chunk (add or update)
  const handleSaveChunk = async () => {
    if (!chunkText.trim()) {
      antdMessage.warning("请输入知识内容");
      return;
    }
    setChunkSaving(true);
    try {
      if (editingChunk) {
        // Update
        const res = await request.put<ApiResponse<ChunkVO>>("/rag/chunk", {
          id: editingChunk.id,
          text: chunkText.trim(),
          heading: chunkHeading.trim() || null,
        });
        if (res.data.code === 200) {
          antdMessage.success("知识条目已更新");
          setChunkModalOpen(false);
          fetchChunks();
          fetchStatus();
        } else {
          antdMessage.error(res.data.message || "更新失败");
        }
      } else {
        // Add
        const res = await request.post<ApiResponse<ChunkVO>>("/rag/chunk", {
          courseId: numericCourseId,
          text: chunkText.trim(),
          heading: chunkHeading.trim() || null,
        });
        if (res.data.code === 200) {
          antdMessage.success("知识条目已添加");
          setChunkModalOpen(false);
          fetchChunks();
          fetchStatus();
        } else {
          antdMessage.error(res.data.message || "添加失败");
        }
      }
    } catch {
      antdMessage.error("操作失败");
    } finally {
      setChunkSaving(false);
    }
  };

  // Delete single chunk
  const handleDeleteChunk = async (chunkId: number) => {
    try {
      const res = await request.delete<ApiResponse<boolean>>(
        `/rag/chunk/${chunkId}`
      );
      if (res.data.code === 200) {
        antdMessage.success("知识条目已删除");
        fetchChunks();
        fetchStatus();
      } else {
        antdMessage.error(res.data.message || "删除失败");
      }
    } catch {
      antdMessage.error("删除失败");
    }
  };

  // Source tag color
  const sourceColor = (source?: string) => {
    switch (source) {
      case "markdown":
        return "blue";
      case "pdf":
        return "red";
      case "docx":
        return "green";
      case "txt":
        return "orange";
      case "manual":
        return "purple";
      default:
        return "default";
    }
  };

  if (!canManage) {
    return (
      <div className="kb-page">
        <Header />
        <div className="kb-empty">
          <Empty description="仅教师或管理员可管理知识库" />
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="kb-page">
        <Header />
        <div className="kb-loading">
          <Spin size="large" />
        </div>
      </div>
    );
  }

  // Table columns
  const columns = [
    {
      title: "#",
      dataIndex: "chunkIndex",
      key: "chunkIndex",
      width: 60,
    },
    {
      title: "章节标题",
      dataIndex: "heading",
      key: "heading",
      width: 200,
      render: (h: string) => h || <span style={{ color: "#aaa" }}>-</span>,
    },
    {
      title: "内容预览",
      dataIndex: "text",
      key: "text",
      ellipsis: true,
      render: (text: string) => (
        <Tooltip
          title={<pre style={{ maxHeight: 300, overflow: "auto", whiteSpace: "pre-wrap", margin: 0 }}>{text}</pre>}
          overlayStyle={{ maxWidth: 600 }}
        >
          <span>{text.length > 100 ? text.slice(0, 100) + "..." : text}</span>
        </Tooltip>
      ),
    },
    {
      title: "来源",
      dataIndex: "source",
      key: "source",
      width: 100,
      render: (s: string) => <Tag color={sourceColor(s)}>{s || "unknown"}</Tag>,
    },
    {
      title: "操作",
      key: "actions",
      width: 140,
      render: (_: unknown, record: ChunkVO) => (
        <Space size="small">
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleOpenEditChunk(record)}
            size="small"
          >
            编辑
          </Button>
          <Popconfirm
            title="确定删除此知识条目？"
            onConfirm={() => handleDeleteChunk(record.id)}
          >
            <Button type="link" danger icon={<DeleteOutlined />} size="small">
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="kb-page">
      <Header />
      <div className="kb-container">
        {/* Top: Back + Title */}
        <div className="kb-header">
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate(`/courses/${numericCourseId}`)}
            type="text"
          >
            返回课程
          </Button>
          <h1>
            <DatabaseOutlined /> 知识库管理
            {course && <span className="kb-course-name">— {course.title}</span>}
          </h1>
        </div>

        {/* Status Card */}
        <Card className="kb-status-card" bordered={false}>
          <div className="kb-status-row">
            <Statistic
              title="知识切片总数"
              value={status?.chunkCount ?? 0}
              prefix={<FileTextOutlined />}
            />
            <Statistic
              title="索引状态"
              value={status?.indexed ? "已索引" : "未索引"}
              valueStyle={{
                color: status?.indexed ? "#52c41a" : "#faad14",
              }}
            />
            {status?.lastIndexTime && (
              <Statistic title="最近索引时间" value={status.lastIndexTime} />
            )}
          </div>
          <Progress
            percent={status?.indexed ? 100 : 0}
            status={status?.indexed ? "success" : "normal"}
            showInfo={false}
            style={{ marginTop: 12 }}
          />
        </Card>

        {/* Action Buttons */}
        <Card className="kb-actions-card" bordered={false}>
          <Space wrap size="middle">
            <Button
              type="primary"
              icon={<ReloadOutlined />}
              onClick={handleBuildIndex}
              loading={indexBuilding}
            >
              从课程内容构建索引
            </Button>
            <Upload {...uploadProps}>
              <Button icon={<UploadOutlined />} loading={uploading}>
                上传文档 (PDF/DOCX/TXT/MD)
              </Button>
            </Upload>
            <Button icon={<PlusOutlined />} onClick={handleOpenAddChunk}>
              手动添加知识条目
            </Button>
            <Popconfirm
              title="确定删除该课程的所有知识库索引？此操作不可恢复。"
              onConfirm={handleDeleteIndex}
            >
              <Button danger icon={<DeleteOutlined />}>
                清空知识库
              </Button>
            </Popconfirm>
          </Space>
        </Card>

        {/* Chunks Table */}
        <Card
          className="kb-chunks-card"
          bordered={false}
          title={`知识切片列表 (${chunks.length} 条)`}
        >
          <Table
            dataSource={chunks}
            columns={columns}
            rowKey="id"
            loading={chunksLoading}
            pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (t) => `共 ${t} 条` }}
            locale={{ emptyText: <Empty description="暂无知识切片，请构建索引或上传文档" /> }}
          />
        </Card>
      </div>

      {/* Add/Edit Chunk Modal */}
      <Modal
        title={editingChunk ? "编辑知识条目" : "添加知识条目"}
        open={chunkModalOpen}
        onCancel={() => setChunkModalOpen(false)}
        onOk={handleSaveChunk}
        confirmLoading={chunkSaving}
        okText="保存"
        cancelText="取消"
        width={640}
      >
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontWeight: 500 }}>章节标题（可选）</label>
          <Input
            placeholder="例如：第二章 > 2.1 数据结构概述"
            value={chunkHeading}
            onChange={(e) => setChunkHeading(e.target.value)}
            style={{ marginTop: 4 }}
          />
        </div>
        <div>
          <label style={{ fontWeight: 500 }}>知识内容</label>
          <Input.TextArea
            rows={8}
            placeholder="输入知识内容文本..."
            value={chunkText}
            onChange={(e) => setChunkText(e.target.value)}
            style={{ marginTop: 4 }}
          />
        </div>
      </Modal>
    </div>
  );
}
