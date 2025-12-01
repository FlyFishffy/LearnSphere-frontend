import { useState } from "react";
import { Button, Input, Card } from "antd";
import request from "../../api/request";
import type { ApiResponse, UserRegisterDTO } from "../../types/api";
import { Link, useNavigate } from "react-router-dom";
import Header from "../../components/Header";
import "./Register.css";

export default function Register() {
  const [form, setForm] = useState<UserRegisterDTO>({
    userAccount: "",
    password: "",
    checkPassword: "",
  });

  const navigate = useNavigate();

  const register = async () => {
    const res = await request.post<ApiResponse<number>>("/user/register", form);
    if (res.data.code === 200) {
      alert("Registration successful!");
      navigate("/");
    } else if (res.data.code === 500) {
      alert("Registration failed. Unknown error.");
    } else {
      alert("Registration failed: " + res.data.message);
    }
  };

  return (
    <div className="register-wrapper">
      <Header />
      <div className="register-container">
        <div className="register-background">
          <div className="bg-shape shape-1"></div>
          <div className="bg-shape shape-2"></div>
          <div className="bg-shape shape-3"></div>
        </div>

        <Card className="register-card" bordered={false}>
          <div className="register-header">
            <h1 className="register-title">创建账户</h1>
            <p className="register-subtitle">加入 LearnSphere，开启学习之旅</p>
          </div>

          <div className="register-form">
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
                placeholder="请输入您的密码（至少6位）"
                size="large"
                className="form-input"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                prefix={<span className="input-icon">🔒</span>}
              />
            </div>

            <div className="form-group">
              <label className="form-label">确认密码</label>
              <Input.Password
                placeholder="请再次输入密码"
                size="large"
                className="form-input"
                value={form.checkPassword}
                onChange={(e) =>
                  setForm({ ...form, checkPassword: e.target.value })
                }
                prefix={<span className="input-icon">🔐</span>}
              />
            </div>

            <Button
              type="primary"
              block
              size="large"
              className="register-button"
              onClick={register}
            >
              注册
            </Button>

            <div className="register-footer">
              <span className="footer-text">已有账号？</span>
              <Link to="/login" className="login-link">
                立即登录
              </Link>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
