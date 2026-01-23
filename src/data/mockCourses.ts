import type { Course } from "../types/api";

export const mockCourses: Course[] = [
  {
    id: 1,
    title: "React 18 核心特性深度解析",
    description: "深入理解React 18的并发特性、自动批处理、Suspense等核心概念，掌握现代React开发最佳实践",
    tags: "前端,React,JavaScript",
    createTime: "2025-01-15T10:00:00Z",
    updateTime: "2025-01-20T15:30:00Z",
    content: `# React 18 核心特性深度解析

## 课程简介

React 18 是 React 框架的重大版本更新，引入了并发渲染、自动批处理等革命性特性。本课程将带你深入理解这些新特性背后的原理和应用场景。

## 1. 并发特性（Concurrent Features）

### 1.1 什么是并发渲染？

并发渲染允许 React 同时准备多个版本的 UI。这意味着 React 可以：

- 中断正在进行的渲染工作
- 优先处理更重要的更新
- 放弃过时的渲染工作

### 1.2 核心 API

\`\`\`jsx
import { useTransition, useDeferredValue } from 'react';

function SearchResults() {
  const [isPending, startTransition] = useTransition();
  const [query, setQuery] = useState('');
  const deferredQuery = useDeferredValue(query);

  const handleChange = (e) => {
    startTransition(() => {
      setQuery(e.target.value);
    });
  };

  return (
    <div>
      <input onChange={handleChange} />
      {isPending && <Spinner />}
      <Results query={deferredQuery} />
    </div>
  );
}
\`\`\`

## 2. 自动批处理（Automatic Batching）

React 18 将多个状态更新自动合并为一次重新渲染，即使它们发生在异步代码中。

### 示例对比

\`\`\`jsx
// React 17: 两次渲染
setTimeout(() => {
  setCount(c => c + 1);
  setFlag(f => !f);
}, 1000);

// React 18: 一次渲染（自动批处理）
setTimeout(() => {
  setCount(c => c + 1);
  setFlag(f => !f);
}, 1000);
\`\`\`

## 3. Suspense 增强

React 18 中的 Suspense 支持服务端渲染和数据获取场景。

\`\`\`jsx
<Suspense fallback={<Loading />}>
  <LazyComponent />
</Suspense>
\`\`\`

## 实践建议

> **重要提示**: 升级到 React 18 时，务必将 \`ReactDOM.render\` 替换为 \`ReactDOM.createRoot\`

1. 逐步采用并发特性
2. 使用 Profiler 监控性能
3. 合理使用 useTransition 和 useDeferredValue

## 总结

React 18 的新特性为构建高性能应用提供了强大工具，建议在新项目中积极采用。
`
  },
  {
    id: 2,
    title: "TypeScript 高级类型系统实战",
    description: "掌握TypeScript的泛型、条件类型、映射类型等高级特性，编写类型安全的企业级应用代码",
    tags: "前端,TypeScript,类型系统",
    createTime: "2025-01-10T09:00:00Z",
    updateTime: "2025-01-18T14:20:00Z",
    content: `# TypeScript 高级类型系统实战

## 课程目标

本课程将深入探讨 TypeScript 的高级类型系统，帮助你编写更健壮、可维护的代码。

## 1. 泛型（Generics）

### 1.1 基础泛型

\`\`\`typescript
function identity<T>(arg: T): T {
  return arg;
}

const result = identity<string>("hello");
\`\`\`

### 1.2 泛型约束

\`\`\`typescript
interface Lengthwise {
  length: number;
}

function loggingIdentity<T extends Lengthwise>(arg: T): T {
  console.log(arg.length);
  return arg;
}

loggingIdentity({ length: 10, value: 3 });
\`\`\`

## 2. 条件类型（Conditional Types）

条件类型允许根据类型关系进行类型推断：

\`\`\`typescript
type IsString<T> = T extends string ? true : false;

type A = IsString<string>;  // true
type B = IsString<number>;  // false
\`\`\`

### 2.1 分布式条件类型

\`\`\`typescript
type ToArray<T> = T extends any ? T[] : never;

type StrArrOrNumArr = ToArray<string | number>;
// 结果: string[] | number[]
\`\`\`

## 3. 映射类型（Mapped Types）

### 3.1 内置映射类型

| 类型 | 说明 | 示例 |
|------|------|------|
| \`Partial<T>\` | 所有属性可选 | \`Partial<User>\` |
| \`Required<T>\` | 所有属性必需 | \`Required<User>\` |
| \`Readonly<T>\` | 所有属性只读 | \`Readonly<User>\` |
| \`Pick<T, K>\` | 选择部分属性 | \`Pick<User, 'id' \\| 'name'>\` |

### 3.2 自定义映射类型

\`\`\`typescript
type Nullable<T> = {
  [P in keyof T]: T[P] | null;
};

interface User {
  id: number;
  name: string;
}

type NullableUser = Nullable<User>;
// { id: number | null; name: string | null; }
\`\`\`

## 4. 实用工具类型

### 4.1 Exclude 和 Extract

\`\`\`typescript
type T0 = Exclude<"a" | "b" | "c", "a">;  // "b" | "c"
type T1 = Extract<"a" | "b" | "c", "a" | "f">;  // "a"
\`\`\`

### 4.2 ReturnType

\`\`\`typescript
function getUserInfo() {
  return { id: 1, name: "Alice", age: 25 };
}

type UserInfo = ReturnType<typeof getUserInfo>;
// { id: number; name: string; age: number; }
\`\`\`

## 最佳实践

1. **优先使用类型推断**：让 TypeScript 自动推断类型
2. **避免使用 any**：使用 unknown 或具体类型
3. **善用联合类型和交叉类型**：构建灵活的类型系统

## 小结

掌握 TypeScript 高级类型系统能显著提升代码质量和开发效率，建议多实践、多思考。
`
  },
  {
    id: 3,
    title: "前端性能优化全攻略",
    description: "从加载优化、渲染优化到运行时优化，全方位提升Web应用性能，打造极致用户体验",
    tags: "前端,性能优化,最佳实践",
    createTime: "2025-01-05T11:00:00Z",
    updateTime: "2025-01-22T16:45:00Z",
    content: `# 前端性能优化全攻略

## 性能优化的重要性

**性能即用户体验**。研究表明：

- 页面加载时间每增加1秒，转化率下降7%
- 53%的移动用户会放弃加载超过3秒的网站
- Google将页面速度作为SEO排名因素

## 1. 加载性能优化

### 1.1 资源优化

\`\`\`javascript
// 代码分割 - 使用动态导入
const HomePage = lazy(() => import('./pages/Home'));
const AboutPage = lazy(() => import('./pages/About'));

function App() {
  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/about" element={<AboutPage />} />
      </Routes>
    </Suspense>
  );
}
\`\`\`

### 1.2 图片优化策略

- 使用 WebP 格式（减少30-50%体积）
- 实现懒加载（Intersection Observer API）
- 响应式图片（\`<picture>\` 或 \`srcset\`）
- 使用 CDN 加速

\`\`\`html
<img 
  src="image-small.jpg"
  srcset="image-small.jpg 400w, image-large.jpg 800w"
  sizes="(max-width: 600px) 400px, 800px"
  loading="lazy"
  alt="描述"
/>
\`\`\`

## 2. 渲染性能优化

### 2.1 虚拟滚动

对于长列表，只渲染可见区域的元素：

\`\`\`jsx
import { FixedSizeList } from 'react-window';

function VirtualList({ items }) {
  const Row = ({ index, style }) => (
    <div style={style}>
      {items[index]}
    </div>
  );

  return (
    <FixedSizeList
      height={600}
      itemCount={items.length}
      itemSize={50}
      width="100%"
    >
      {Row}
    </FixedSizeList>
  );
}
\`\`\`

### 2.2 避免重复渲染

\`\`\`jsx
// 使用 React.memo 优化组件
const ExpensiveComponent = React.memo(({ data }) => {
  return <div>{/* 复杂渲染逻辑 */}</div>;
}, (prevProps, nextProps) => {
  return prevProps.data.id === nextProps.data.id;
});
\`\`\`

## 3. 运行时性能优化

### 3.1 防抖与节流

\`\`\`javascript
// 防抖：最后一次触发后执行
function debounce(fn, delay) {
  let timer;
  return function(...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

// 节流：固定时间间隔执行
function throttle(fn, delay) {
  let lastTime = 0;
  return function(...args) {
    const now = Date.now();
    if (now - lastTime >= delay) {
      fn.apply(this, args);
      lastTime = now;
    }
  };
}
\`\`\`

### 3.2 Web Workers

将密集计算任务移至后台线程：

\`\`\`javascript
// worker.js
self.addEventListener('message', (e) => {
  const result = heavyComputation(e.data);
  self.postMessage(result);
});

// main.js
const worker = new Worker('worker.js');
worker.postMessage(data);
worker.onmessage = (e) => {
  console.log('计算结果:', e.data);
};
\`\`\`

## 4. 性能监控

### 4.1 关键指标

| 指标 | 说明 | 目标值 |
|------|------|--------|
| FCP | 首次内容绘制 | < 1.8s |
| LCP | 最大内容绘制 | < 2.5s |
| FID | 首次输入延迟 | < 100ms |
| CLS | 累积布局偏移 | < 0.1 |

### 4.2 使用 Performance API

\`\`\`javascript
// 测量加载时间
const perfData = performance.getEntriesByType('navigation')[0];
console.log('DOM加载时间:', perfData.domContentLoadedEventEnd);
console.log('页面完全加载时间:', perfData.loadEventEnd);
\`\`\`

## 优化清单

- [ ] 启用 Gzip/Brotli 压缩
- [ ] 使用 HTTP/2 或 HTTP/3
- [ ] 实现服务端渲染（SSR）或静态生成（SSG）
- [ ] 配置浏览器缓存策略
- [ ] Tree Shaking 删除未使用代码
- [ ] 使用 Lighthouse 定期审计

## 总结

性能优化是持续的过程，需要结合实际业务场景，使用工具量化效果，逐步迭代改进。
`
  },
  {
    id: 4,
    title: "Vite 构建工具深度剖析",
    description: "理解Vite的核心原理、插件系统和构建优化，掌握下一代前端工具链的使用技巧",
    tags: "前端,构建工具,Vite",
    createTime: "2025-01-12T13:00:00Z",
    updateTime: "2025-01-19T10:15:00Z",
    content: `# Vite 构建工具深度剖析

## Vite 简介

Vite 是新一代前端构建工具，利用浏览器原生 ES 模块支持，提供极速的开发体验。

### 核心优势

1. **极速冷启动**：无需打包，直接启动开发服务器
2. **即时热更新**：利用 ESM 的精确更新
3. **按需编译**：只编译当前屏幕正在使用的代码
4. **开箱即用**：内置 TypeScript、JSX、CSS 预处理器支持

## 1. 核心原理

### 1.1 开发模式

Vite 在开发环境使用 **esbuild** 预构建依赖：

\`\`\`javascript
// Vite 处理流程
浏览器请求 → Vite 服务器 → ESBuild 转换 → 返回 ESM 模块
\`\`\`

### 1.2 生产构建

生产环境使用 **Rollup** 进行打包：

- Tree Shaking
- 代码分割
- 资源优化

## 2. 配置详解

### 2.1 基础配置

\`\`\`typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: '0.0.0.0',
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\\/api/, '')
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['react', 'react-dom'],
          'ui': ['antd']
        }
      }
    }
  }
});
\`\`\`

### 2.2 路径别名

\`\`\`typescript
export default defineConfig({
  resolve: {
    alias: {
      '@': '/src',
      '@components': '/src/components',
      '@utils': '/src/utils'
    }
  }
});
\`\`\`

## 3. 插件系统

### 3.1 官方插件

- **@vitejs/plugin-react**：React 支持
- **@vitejs/plugin-vue**：Vue 支持
- **@vitejs/plugin-legacy**：传统浏览器支持

### 3.2 自定义插件

\`\`\`typescript
function myPlugin() {
  return {
    name: 'my-plugin',
    transform(code, id) {
      if (id.endsWith('.custom')) {
        return {
          code: transformCode(code),
          map: null
        };
      }
    }
  };
}
\`\`\`

## 4. 性能优化技巧

### 4.1 依赖预构建

\`\`\`typescript
export default defineConfig({
  optimizeDeps: {
    include: ['lodash-es', 'axios'],
    exclude: ['@local/package']
  }
});
\`\`\`

### 4.2 构建优化

\`\`\`typescript
export default defineConfig({
  build: {
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    },
    chunkSizeWarningLimit: 1000
  }
});
\`\`\`

## 5. 环境变量

### 5.1 使用 .env 文件

\`\`\`bash
# .env.development
VITE_API_URL=http://localhost:8080
VITE_APP_TITLE=开发环境

# .env.production
VITE_API_URL=https://api.example.com
VITE_APP_TITLE=生产环境
\`\`\`

### 5.2 代码中访问

\`\`\`typescript
const apiUrl = import.meta.env.VITE_API_URL;
const isDev = import.meta.env.DEV;
const isProd = import.meta.env.PROD;
\`\`\`

## 6. 常见问题

### 问题1：模块找不到

> **解决方案**：检查依赖是否已安装，路径别名是否配置正确

### 问题2：热更新失效

> **解决方案**：检查 HMR 边界是否正确，是否使用了 \`import.meta.hot.accept()\`

## 最佳实践

1. 合理配置 \`optimizeDeps\`，加速预构建
2. 使用 \`manualChunks\` 优化代码分割
3. 开发环境禁用 sourcemap 提升速度
4. 生产环境启用压缩和 Tree Shaking

## 总结

Vite 代表了前端工具链的未来方向，其极速的开发体验和出色的构建性能值得所有前端开发者学习掌握。
`
  },
  {
    id: 5,
    title: "现代CSS布局技术详解",
    description: "掌握Flexbox、Grid、Container Queries等现代CSS布局方案，构建响应式设计",
    tags: "前端,CSS,布局",
    createTime: "2025-01-08T14:30:00Z",
    updateTime: "2025-01-21T11:00:00Z",
    content: `# 现代CSS布局技术详解

## 课程概览

本课程将系统讲解现代 CSS 布局技术，包括 Flexbox、Grid 和最新的 Container Queries。

## 1. Flexbox 弹性布局

### 1.1 核心概念

Flexbox 提供一维布局能力，适合**组件内部**的布局排列。

\`\`\`css
.container {
  display: flex;
  justify-content: space-between;  /* 主轴对齐 */
  align-items: center;             /* 交叉轴对齐 */
  gap: 20px;                       /* 项目间距 */
}

.item {
  flex: 1;           /* flex-grow: 1, flex-shrink: 1, flex-basis: 0% */
  min-width: 0;      /* 防止溢出 */
}
\`\`\`

### 1.2 常见布局模式

**水平居中**

\`\`\`css
.center-h {
  display: flex;
  justify-content: center;
}
\`\`\`

**垂直居中**

\`\`\`css
.center-v {
  display: flex;
  align-items: center;
  min-height: 100vh;
}
\`\`\`

**完美居中**

\`\`\`css
.center {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
}
\`\`\`

## 2. Grid 网格布局

### 2.1 基础语法

Grid 提供二维布局能力，适合**页面级**的整体布局。

\`\`\`css
.grid-container {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: auto 1fr auto;
  gap: 20px;
  height: 100vh;
}

.header {
  grid-column: 1 / -1;  /* 跨越所有列 */
}

.sidebar {
  grid-row: 2 / 3;
}

.main {
  grid-column: 2 / -1;
}

.footer {
  grid-column: 1 / -1;
}
\`\`\`

### 2.2 响应式网格

\`\`\`css
.responsive-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
}
\`\`\`

**auto-fit vs auto-fill**

- \`auto-fit\`: 列宽会自动拉伸填充空白空间
- \`auto-fill\`: 保持列宽，可能留有空白空间

## 3. Container Queries

### 3.1 基本用法

Container Queries 允许基于**父容器**尺寸进行样式调整：

\`\`\`css
.card-container {
  container-type: inline-size;
  container-name: card;
}

@container card (min-width: 400px) {
  .card {
    display: grid;
    grid-template-columns: 1fr 2fr;
  }
}

@container card (max-width: 399px) {
  .card {
    display: block;
  }
}
\`\`\`

### 3.2 优势对比

| 特性 | Media Queries | Container Queries |
|------|---------------|-------------------|
| 查询对象 | 视口尺寸 | 容器尺寸 |
| 组件复用 | 困难 | 简单 |
| 适用场景 | 页面级布局 | 组件级响应式 |

## 4. 实战案例

### 4.1 圣杯布局（Grid实现）

\`\`\`css
.holy-grail {
  display: grid;
  grid-template-areas:
    "header header header"
    "nav main aside"
    "footer footer footer";
  grid-template-columns: 200px 1fr 200px;
  grid-template-rows: auto 1fr auto;
  min-height: 100vh;
}

.header { grid-area: header; }
.nav { grid-area: nav; }
.main { grid-area: main; }
.aside { grid-area: aside; }
.footer { grid-area: footer; }

@media (max-width: 768px) {
  .holy-grail {
    grid-template-areas:
      "header"
      "nav"
      "main"
      "aside"
      "footer";
    grid-template-columns: 1fr;
  }
}
\`\`\`

### 4.2 卡片网格（Flexbox实现）

\`\`\`css
.card-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
}

.card {
  flex: 1 1 calc(33.333% - 20px);
  min-width: 250px;
}

@media (max-width: 768px) {
  .card {
    flex-basis: calc(50% - 20px);
  }
}

@media (max-width: 480px) {
  .card {
    flex-basis: 100%;
  }
}
\`\`\`

## 5. 最佳实践

### 选择合适的布局方案

- **Flexbox**：导航栏、工具栏、卡片内部
- **Grid**：页面整体布局、仪表盘、复杂网格
- **Container Queries**：可复用组件的响应式设计

### 性能考虑

1. 避免深层嵌套的 Grid/Flexbox
2. 使用 \`will-change\` 提示浏览器优化
3. 合理使用 \`gap\` 替代 margin

\`\`\`css
.optimized {
  display: grid;
  will-change: grid-template-columns;
  gap: 20px;  /* 优于 margin */
}
\`\`\`

## 总结

现代 CSS 布局技术为我们提供了强大而灵活的工具，合理运用能大幅提升开发效率和用户体验。
`
  },
  {
    id: 6,
    title: "Web安全攻防实战",
    description: "深入了解XSS、CSRF、SQL注入等常见Web安全漏洞，学习安全防护最佳实践",
    tags: "安全,Web,后端",
    createTime: "2025-01-03T08:00:00Z",
    updateTime: "2025-01-17T09:30:00Z",
    content: `# Web安全攻防实战

## 安全的重要性

> "安全不是可选项，而是必需品。" —— OWASP

Web 应用面临的威胁日益复杂，本课程将帮助你建立全面的安全意识。

## 1. XSS（跨站脚本攻击）

### 1.1 攻击原理

攻击者在网页中注入恶意脚本，当其他用户访问时执行。

**示例：反射型XSS**

\`\`\`javascript
// 危险代码
const searchQuery = new URLSearchParams(location.search).get('q');
document.getElementById('result').innerHTML = searchQuery;

// 攻击URL
// https://example.com/search?q=<script>alert('XSS')</script>
\`\`\`

### 1.2 防御措施

**输入验证和输出编码**

\`\`\`javascript
// 使用 DOMPurify 清理用户输入
import DOMPurify from 'dompurify';

const clean = DOMPurify.sanitize(userInput);
document.getElementById('result').innerHTML = clean;

// 或使用 textContent 而非 innerHTML
document.getElementById('result').textContent = userInput;
\`\`\`

**CSP（内容安全策略）**

\`\`\`html
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self'; script-src 'self' https://trusted.cdn.com">
\`\`\`

## 2. CSRF（跨站请求伪造）

### 2.1 攻击场景

攻击者诱导用户访问恶意网站，利用用户的登录态发起非预期请求。

### 2.2 防御方案

**CSRF Token**

\`\`\`javascript
// 服务端生成 token
const csrfToken = generateToken();
res.cookie('XSRF-TOKEN', csrfToken, { httpOnly: false });

// 客户端携带 token
axios.post('/api/transfer', data, {
  headers: {
    'X-XSRF-TOKEN': getCookie('XSRF-TOKEN')
  }
});

// 服务端验证
if (req.headers['x-xsrf-token'] !== req.session.csrfToken) {
  return res.status(403).send('Invalid CSRF token');
}
\`\`\`

**SameSite Cookie**

\`\`\`javascript
res.cookie('sessionId', token, {
  httpOnly: true,
  secure: true,
  sameSite: 'strict'
});
\`\`\`

## 3. SQL注入

### 3.1 漏洞示例

\`\`\`javascript
// 危险：直接拼接SQL
const query = \`SELECT * FROM users WHERE username = '\${username}'\`;

// 攻击输入
// username = "admin' OR '1'='1"
// 实际执行：SELECT * FROM users WHERE username = 'admin' OR '1'='1'
\`\`\`

### 3.2 防御方法

**使用参数化查询**

\`\`\`javascript
// 安全：使用占位符
const query = 'SELECT * FROM users WHERE username = ?';
db.execute(query, [username]);

// ORM（如 Sequelize）
User.findOne({ where: { username: username } });
\`\`\`

## 4. 认证与授权

### 4.1 JWT 最佳实践

\`\`\`javascript
// 生成 JWT
const token = jwt.sign(
  { userId: user.id, role: user.role },
  process.env.JWT_SECRET,
  { expiresIn: '1h', algorithm: 'HS256' }
);

// 验证 JWT
function authenticateToken(req, res, next) {
  const token = req.headers['authorization']?.split(' ')[1];
  
  if (!token) {
    return res.status(401).send('Unauthorized');
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).send('Forbidden');
    req.user = user;
    next();
  });
}
\`\`\`

### 4.2 密码存储

\`\`\`javascript
const bcrypt = require('bcrypt');

// 注册时哈希密码
const hashedPassword = await bcrypt.hash(password, 10);

// 登录时验证
const isValid = await bcrypt.compare(password, user.hashedPassword);
\`\`\`

## 5. HTTPS 和安全传输

### 5.1 强制 HTTPS

\`\`\`javascript
// Express 中间件
app.use((req, res, next) => {
  if (req.header('x-forwarded-proto') !== 'https') {
    res.redirect(\`https://\${req.header('host')}\${req.url}\`);
  } else {
    next();
  }
});
\`\`\`

### 5.2 安全响应头

\`\`\`javascript
const helmet = require('helmet');

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));
\`\`\`

## 6. 安全清单

### 开发阶段

- [ ] 所有用户输入都经过验证和清理
- [ ] 使用参数化查询防止 SQL 注入
- [ ] 实施 CSRF 保护机制
- [ ] 密码使用 bcrypt 等安全哈希
- [ ] 敏感信息不存储在客户端
- [ ] 配置 CORS 白名单

### 部署阶段

- [ ] 启用 HTTPS
- [ ] 设置安全响应头
- [ ] 定期更新依赖包
- [ ] 关闭不必要的服务和端口
- [ ] 实施日志监控
- [ ] 定期进行安全审计

## 工具推荐

| 工具 | 用途 | 网址 |
|------|------|------|
| OWASP ZAP | 漏洞扫描 | zaproxy.org |
| Burp Suite | 渗透测试 | portswigger.net |
| npm audit | 依赖检查 | 内置命令 |
| Snyk | 漏洞监控 | snyk.io |

## 总结

安全是一个持续的过程，需要在开发的每个阶段都保持警惕。遵循最佳实践，使用安全工具，定期审计代码，才能构建真正安全的 Web 应用。
`
  }
];
