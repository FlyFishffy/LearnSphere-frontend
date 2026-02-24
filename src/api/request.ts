import axios from "axios";

const request = axios.create({
  // baseURL: "http://localhost:8888/api",
  baseURL: "/api",
  timeout: 120000,
  withCredentials: true,
});

export default request;
