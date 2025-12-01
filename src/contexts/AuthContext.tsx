import { useState, useEffect } from "react";
import type { ReactNode } from "react";
import request from "../api/request";
import type { ApiResponse, LoginUserVO } from "../types/api";
import { AuthContext } from "./authContext";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<LoginUserVO | null>(null);
  const [loading, setLoading] = useState(true);

  // 检查用户登录状态
  const checkLoginStatus = async () => {
    try {
      const res = await request.get<ApiResponse<LoginUserVO>>(
        "/user/get/login"
      );
      if (res.data.code === 200 && res.data.data) {
        setUser(res.data.data);
      } else {
        setUser(null);
      }
    } catch (error) {
      alert("Error checking login status: " + error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkLoginStatus();
  }, []);

  const logout = async () => {
    try {
      const res = await request.post<ApiResponse<boolean>>("/user/logout");
      if (res.data.code === 200) {
        // 后端登出成功，清除本地状态
        setUser(null);
      } else {
        // 即使后端返回错误，也清除本地状态
        setUser(null);
        console.error("Logout failed:", res.data.message);
      }
    } catch (error) {
      // 即使请求失败，也清除本地状态（可能是网络问题）
      setUser(null);
      console.error("Logout error:", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, setUser, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
