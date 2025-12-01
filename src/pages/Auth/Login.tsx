import { useState } from "react";
import { Button, Input, Card } from "antd";
import request from "../../api/request";
import type { ApiResponse, LoginUserVO, UserLoginDTO } from "../../types/api";
import { Link, useNavigate } from "react-router-dom";
import Header from "../../components/Header";
import { useAuth } from "../../hooks/useAuth";
import "./Login.css";

export default function Login() {
  const [form, setForm] = useState<UserLoginDTO>({
    userAccount: "",
    password: "",
  });

  const navigate = useNavigate();
  const { setUser } = useAuth();

  const login = async () => {
    const res = await request.post<ApiResponse<LoginUserVO>>(
      "/user/login",
      form
    );
    if (res.data.code === 200) {
      // 更新用户状态
      setUser(res.data.data);
      alert("登录成功：" + res.data.data.userName);
      navigate("/");
    } else if (res.data.code === 50001) {
      alert("Login failed: " + res.data.message);
    } else {
      alert("Login failed: Unknown error");
    }
  };

  return (
    <div className="login-wrapper">
      <Header />
      <div className="login-container">
        <div className="login-background">
          <div className="bg-shape shape-1"></div>
          <div className="bg-shape shape-2"></div>
          <div className="bg-shape shape-3"></div>
        </div>

        <Card className="login-card" bordered={false}>
          <div className="login-header">
            <h1 className="login-title">欢迎回来</h1>
            <p className="login-subtitle">登录您的 LearnSphere 账户</p>
          </div>

          <div className="login-form">
            <div className="form-group">
              <label className="form-label">账号</label>
              <Input
                placeholder="请输入您的账号"
                size="large"
                className="form-input"
                value={form.userAccount}
                onChange={(e) =>
                  setForm({ ...form, userAccount: e.target.value })
                }
                prefix={<span className="input-icon">👤</span>}
              />
            </div>

            <div className="form-group">
              <label className="form-label">密码</label>
              <Input.Password
                placeholder="请输入您的密码"
                size="large"
                className="form-input"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                prefix={<span className="input-icon">🔒</span>}
              />
            </div>

            <Button
              type="primary"
              block
              size="large"
              className="login-button"
              onClick={login}
            >
              登录
            </Button>

            <div className="login-footer">
              <span className="footer-text">还没有账号？</span>
              <Link to="/register" className="register-link">
                立即注册
              </Link>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
