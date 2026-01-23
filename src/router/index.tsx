import { createBrowserRouter } from "react-router-dom";
import Home from "../pages/Home/Home";
import Login from "../pages/Auth/Login";
import Register from "../pages/Auth/Register";
import CourseList from "../pages/Course/CourseList";
import CourseDetail from "../pages/Course/CourseDetail";
import AIAssistant from "../pages/AI/AIAssistant";

const router = createBrowserRouter([
  { path: "/", element: <Home /> },
  { path: "/login", element: <Login /> },
  { path: "/register", element: <Register /> },
  { path: "/courses", element: <CourseList /> },
  { path: "/course/:id", element: <CourseDetail /> },
  { path: "/ai", element: <AIAssistant /> },
]);

export default router;
