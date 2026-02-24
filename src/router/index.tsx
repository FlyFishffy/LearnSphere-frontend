import { createBrowserRouter } from "react-router-dom";
import Home from "../pages/Home/Home";
import Login from "../pages/Auth/Login";
import Register from "../pages/Auth/Register";
import CourseList from "../pages/Course/CourseList";
import CourseDetail from "../pages/Course/CourseDetail";
import CourseForm from "../pages/Course/CourseForm";
import AIAssistant from "../pages/AI/AIAssistant";
import LearningCenter from "../pages/Learning/LearningCenter";


const router = createBrowserRouter([
  { path: "/", element: <Home /> },
  { path: "/login", element: <Login /> },
  { path: "/register", element: <Register /> },
  { path: "/courses", element: <CourseList /> },
  { path: "/courses/new", element: <CourseForm /> },
  { path: "/courses/edit/:id", element: <CourseForm /> },
  { path: "/courses/:id", element: <CourseDetail /> },
  { path: "/ai", element: <AIAssistant /> },
  { path: "/learning", element: <LearningCenter /> },


]);

export default router;
