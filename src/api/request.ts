import axios from "axios";

const request = axios.create({
  baseURL: "http://localhost:8888/api",
  timeout: 15000,
  withCredentials: true,
});

export default request;
