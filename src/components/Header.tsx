import { Link, useNavigate } from "react-router-dom";
import { Dropdown, Avatar } from "antd";
import type { MenuProps } from "antd";
import { UserOutlined, LogoutOutlined } from "@ant-design/icons";
import "./Header.css";
import { useAuth } from "../hooks/useAuth";

export default function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const userMenuItems: MenuProps["items"] = [
    {
      key: "profile",
      label: <span>个人中心</span>,
      icon: <UserOutlined />,
    },
    {
      type: "divider",
    },
    {
      key: "logout",
      label: <span>退出登录</span>,
      icon: <LogoutOutlined />,
      onClick: handleLogout,
    },
  ];

  return (
    <div className="header-container">
      <Link to="/" className="logo" style={{ textDecoration: "none" }}>
        LearnSphere
      </Link>

      <div className="header-right">
        <Link to="/">首页</Link>
        <Link to="/courses">课程</Link>
        <Link to="/ai">AI 助教</Link>

        {user ? (
          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
            <div className="user-info">
              <Avatar
                style={{
                  backgroundColor: "#ff6b6b",
                  marginRight: "8px",
                }}
                icon={<UserOutlined />}
              />
              <span className="user-name">{user.userName}</span>
            </div>
          </Dropdown>
        ) : (
          <>
            <Link to="/login" className="header-btn">
              登录
            </Link>
            <Link to="/register" className="header-btn header-btn-primary">
              注册
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
