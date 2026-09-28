/**
 * 后台页：先检查 token，再画侧栏和内容区。
 */
import { clearToken, getToken, request } from "./api.js";
import { errorMessage, escapeHtml, mustElement } from "./dom.js";
import type {
  Course,
  CoursePayload,
  CourseStatus,
  DashboardStats,
  MenuId,
  MenuItem,
  Notice,
  NoticePayload,
  NoticeStatus,
  OperationLog,
  Student,
  StudentGender,
  StudentPayload,
  StudentStatus,
  User,
  UserPayload,
  UserRole,
  UserStatus,
} from "./types.js";

if (!getToken()) {
  location.replace("/login.html");
}

const menuBox = mustElement<HTMLElement>("#menu");
const content = mustElement<HTMLElement>("#content");
const pageTitle = mustElement<HTMLHeadingElement>("#page-title");
const currentUserLabel = mustElement<HTMLSpanElement>("#current-user");
const dialog = mustElement<HTMLDialogElement>("#user-dialog");
const form = mustElement<HTMLFormElement>("#user-form");
const dialogError = mustElement<HTMLParagraphElement>("#dialog-error");
const passwordLabel = mustElement<HTMLLabelElement>("#password-label");
const usernameInput = mustElement<HTMLInputElement>("#user-username");
const courseDialog = mustElement<HTMLDialogElement>("#course-dialog");
const courseForm = mustElement<HTMLFormElement>("#course-form");
const courseDialogError = mustElement<HTMLParagraphElement>("#course-dialog-error");
const courseCoverInput = mustElement<HTMLInputElement>("#course-cover");
const courseCoverPreview = mustElement<HTMLImageElement>("#course-cover-preview");
const noticeDialog = mustElement<HTMLDialogElement>("#notice-dialog");
const noticeForm = mustElement<HTMLFormElement>("#notice-form");
const noticeDialogError = mustElement<HTMLParagraphElement>("#notice-dialog-error");

const studentDialog = mustElement<HTMLDialogElement>("#student-dialog");
const studentForm = mustElement<HTMLFormElement>("#student-form");
const studentDialogError = mustElement<HTMLParagraphElement>("#student-dialog-error");
const studentNoInput = mustElement<HTMLInputElement>("#student-no");

const titles: Record<MenuId, string> = {
  dashboard: "工作台",
  users: "用户管理",
  courses: "课程管理",
  students: "学生管理",
  notices: "公告管理",
  logs: "操作日志",
};

const roleText: Record<UserRole, string> = {
  admin: "管理员",
  teacher: "教师",
};
const statusText: Record<UserStatus, string> = {
  active: "启用",
  disabled: "停用",
};
const courseStatusText: Record<CourseStatus, string> = {
  open: "招生中",
  closed: "已结课",
};
const noticeStatusText: Record<NoticeStatus, string> = {
  published: "已发布",
  draft: "草稿",
};

const studentStatusText: Record<StudentStatus, string> = {
  active: "在校",
  disabled: "离校",
};

const studentGenderText: Record<StudentGender, string> = {
  male: "男",
  female: "女",
};

function formatTime(value: string): string {
  return new Date(value).toLocaleString("zh-CN", { hour12: false });
}

function currentPage(): MenuId {
  const hash = location.hash.replace("#", "") || "/dashboard";
  const page = hash.replace(/^\//, "") || "dashboard";
  if (page in titles) return page as MenuId;
  return "dashboard";
}

async function renderDashboard(): Promise<void> {
  const data = await request<DashboardStats>("/api/dashboard");
  content.innerHTML = `
    <section class="cards four">
      <article class="stat"><span>教务账号</span><strong>${data.userCount}</strong></article>
      <article class="stat"><span>在营课程</span><strong>${data.courseCount}</strong></article>
      <article class="stat"><span>校内公告</span><strong>${data.noticeCount}</strong></article>
      <article class="stat"><span>操作记录</span><strong>${data.logCount}</strong></article>
    </section>
    <section class="panel">
      <h2>今日待办</h2>
      <p>核对招生中的课班封面，把草稿公告改完再发布。重要改动会出现在操作日志里。</p>
    </section>
  `;
}

async function renderUsers(keyword = ""): Promise<void> {
  const users = await request<User[]>(
    `/api/users?keyword=${encodeURIComponent(keyword)}`,
  );
  const rows = users
    .map(
      (user) => `
        <tr>
          <td>${user.id}</td>
          <td>${escapeHtml(user.username)}</td>
          <td>${escapeHtml(user.name)}</td>
          <td>${roleText[user.role]}</td>
          <td><span class="tag ${user.status}">${statusText[user.status]}</span></td>
          <td>${escapeHtml(user.email)}</td>
          <td>
            <button type="button" data-user-edit="${user.id}">编辑</button>
            <button type="button" class="danger" data-user-remove="${user.id}">删除</button>
          </td>
        </tr>
      `,
    )
    .join("");

  content.innerHTML = `
    <section class="toolbar">
      <form id="search-form">
        <input id="keyword" name="keyword" placeholder="搜索用户名或姓名" value="${escapeHtml(keyword)}" />
        <button type="submit">查询</button>
      </form>
      <button type="button" id="create-user">新增用户</button>
    </section>
    <section class="panel table-wrap">
      <table>
        <thead>
          <tr>
            <th>编号</th><th>用户名</th><th>姓名</th><th>角色</th><th>状态</th><th>邮箱</th><th>操作</th>
          </tr>
        </thead>
        <tbody>${rows || `<tr><td colspan="7" class="empty">没有匹配的用户</td></tr>`}</tbody>
      </table>
    </section>
  `;

  mustElement<HTMLFormElement>("#search-form").addEventListener("submit", (event) => {
    event.preventDefault();
    void renderUsers(mustElement<HTMLInputElement>("#keyword").value);
  });
  mustElement<HTMLButtonElement>("#create-user").addEventListener("click", () => {
    openDialog();
  });
}

async function renderCourses(keyword = ""): Promise<void> {
  const courses = await request<Course[]>(
    `/api/courses?keyword=${encodeURIComponent(keyword)}`,
  );
  const cards = courses
    .map(
      (course) => `
        <article class="course-card">
          <img class="course-cover" src="${escapeHtml(course.cover)}" alt="${escapeHtml(course.title)}" />
          <div class="course-body">
            <div class="course-meta">
              <span class="tag ${course.status}">${courseStatusText[course.status]}</span>
              <span>${course.hours} 课时</span>
            </div>
            <h2>${escapeHtml(course.title)}</h2>
            <p>${escapeHtml(course.summary)}</p>
            <p class="course-teacher">教师 ${escapeHtml(course.teacher)}</p>
            <div class="course-actions">
              <button type="button" data-course-edit="${course.id}">编辑</button>
              <button type="button" class="danger" data-course-remove="${course.id}">删除</button>
            </div>
          </div>
        </article>
      `,
    )
    .join("");

  content.innerHTML = `
    <section class="toolbar">
      <form id="course-search-form">
        <input id="course-keyword" name="keyword" placeholder="搜索课程名称或教师" value="${escapeHtml(keyword)}" />
        <button type="submit">查询</button>
      </form>
      <button type="button" id="create-course">新增课程</button>
    </section>
    <section class="course-grid">
      ${cards || `<p class="empty">没有匹配的课程</p>`}
    </section>
  `;

  mustElement<HTMLFormElement>("#course-search-form").addEventListener(
    "submit",
    (event) => {
      event.preventDefault();
      void renderCourses(mustElement<HTMLInputElement>("#course-keyword").value);
    },
  );
  mustElement<HTMLButtonElement>("#create-course").addEventListener("click", () => {
    openCourseDialog();
  });
}

async function renderNotices(keyword = ""): Promise<void> {
  const notices = await request<Notice[]>(
    `/api/notices?keyword=${encodeURIComponent(keyword)}`,
  );
  const cards = notices
    .map(
      (notice) => `
        <article class="notice-card">
          <div class="notice-head">
            <h2>${escapeHtml(notice.title)}</h2>
            <span class="tag ${notice.status}">${noticeStatusText[notice.status]}</span>
          </div>
          <p>${escapeHtml(notice.content)}</p>
          <div class="notice-foot">
            <span>${escapeHtml(notice.author)} · ${formatTime(notice.createdAt)}</span>
            <div class="course-actions">
              <button type="button" data-notice-edit="${notice.id}">编辑</button>
              <button type="button" class="danger" data-notice-remove="${notice.id}">删除</button>
            </div>
          </div>
        </article>
      `,
    )
    .join("");

  content.innerHTML = `
    <section class="toolbar">
      <form id="notice-search-form">
        <input id="notice-keyword" name="keyword" placeholder="搜索标题或作者" value="${escapeHtml(keyword)}" />
        <button type="submit">查询</button>
      </form>
      <button type="button" id="create-notice">发布公告</button>
    </section>
    <section class="notice-list">
      ${cards || `<p class="empty">没有匹配的公告</p>`}
    </section>
  `;

  mustElement<HTMLFormElement>("#notice-search-form").addEventListener(
    "submit",
    (event) => {
      event.preventDefault();
      void renderNotices(mustElement<HTMLInputElement>("#notice-keyword").value);
    },
  );
  mustElement<HTMLButtonElement>("#create-notice").addEventListener("click", () => {
    openNoticeDialog();
  });
}

async function renderStudents(keyword = ""): Promise<void> {
  const students = await request<Student[]>(
    `/api/students?keyword=${encodeURIComponent(keyword)}`,
  );
  const rows = students
    .map(
      (student) => `
        <tr>
          <td>${student.id}</td>
          <td>${escapeHtml(student.studentNo)}</td>
          <td>${escapeHtml(student.name)}</td>
          <td>${studentGenderText[student.gender]}</td>
          <td>${escapeHtml(student.className)}</td>
          <td>${escapeHtml(student.phone)}</td>
          <td><span class="tag ${student.status}">${studentStatusText[student.status]}</span></td>
          <td>
            <button type="button" data-student-edit="${student.id}">编辑</button>
            <button type="button" class="danger" data-student-remove="${student.id}">删除</button>
          </td>
        </tr>
      `,
    )
    .join("");

  content.innerHTML = `
    <section class="toolbar">
      <form id="student-search-form">
        <input id="student-keyword" name="keyword" placeholder="搜索学号或姓名" value="${escapeHtml(keyword)}" />
        <button type="submit">查询</button>
      </form>
      <button type="button" id="create-student">新增学生</button>
    </section>
    <section class="panel table-wrap">
      <table>
        <thead>
          <tr>
            <th>编号</th><th>学号</th><th>姓名</th><th>性别</th><th>班级</th><th>联系电话</th><th>状态</th><th>操作</th>
          </tr>
        </thead>
        <tbody>${rows || `<tr><td colspan="8" class="empty">没有匹配的学生</td></tr>`}</tbody>
      </table>
    </section>
  `;

  mustElement<HTMLFormElement>("#student-search-form").addEventListener(
    "submit",
    (event) => {
      event.preventDefault();
      void renderStudents(mustElement<HTMLInputElement>("#student-keyword").value);
    },
  );
  mustElement<HTMLButtonElement>("#create-student").addEventListener("click", () => {
    openStudentDialog();
  });
}

async function renderLogs(keyword = "", moduleName = ""): Promise<void> {
  const query = new URLSearchParams({ keyword, module: moduleName });
  const logs = await request<OperationLog[]>(`/api/logs?${query}`);
  const rows = logs
    .map(
      (item) => `
        <tr>
          <td>${formatTime(item.createdAt)}</td>
          <td>${escapeHtml(item.actorName)}</td>
          <td>${escapeHtml(item.module)}</td>
          <td>${escapeHtml(item.action)}</td>
          <td>${escapeHtml(item.detail)}</td>
        </tr>
      `,
    )
    .join("");

  content.innerHTML = `
    <section class="toolbar">
      <form id="log-search-form">
        <input id="log-keyword" name="keyword" placeholder="搜索操作人、动作或详情" value="${escapeHtml(keyword)}" />
        <select id="log-module">
          <option value="">全部模块</option>
          <option value="账号">账号</option>
          <option value="用户">用户</option>
          <option value="课程">课程</option>
          <option value="公告">公告</option>
          <option value="学生">学生</option>
        </select>
        <button type="submit">查询</button>
      </form>
    </section>
    <section class="panel table-wrap">
      <table>
        <thead>
          <tr>
            <th>时间</th><th>操作人</th><th>模块</th><th>动作</th><th>详情</th>
          </tr>
        </thead>
        <tbody>${rows || `<tr><td colspan="5" class="empty">没有匹配的记录</td></tr>`}</tbody>
      </table>
    </section>
  `;

  mustElement<HTMLSelectElement>("#log-module").value = moduleName;
  mustElement<HTMLFormElement>("#log-search-form").addEventListener(
    "submit",
    (event) => {
      event.preventDefault();
      void renderLogs(
        mustElement<HTMLInputElement>("#log-keyword").value,
        mustElement<HTMLSelectElement>("#log-module").value,
      );
    },
  );
}

function openDialog(user?: User): void {
  dialogError.hidden = true;
  form.reset();
  mustElement<HTMLInputElement>("#user-id").value = user ? String(user.id) : "";
  mustElement<HTMLHeadingElement>("#dialog-title").textContent = user
    ? "编辑用户"
    : "新增用户";
  usernameInput.value = user ? user.username : "";
  usernameInput.disabled = Boolean(user);
  mustElement<HTMLInputElement>("#user-name").value = user ? user.name : "";
  mustElement<HTMLInputElement>("#user-email").value = user ? user.email : "";
  mustElement<HTMLSelectElement>("#user-role").value = user ? user.role : "teacher";
  mustElement<HTMLSelectElement>("#user-status").value = user
    ? user.status
    : "active";
  mustElement<HTMLInputElement>("#user-password").value = "";
  passwordLabel.querySelector("input")!.required = !user;
  passwordLabel.querySelector("span")?.remove();
  if (user) {
    const hint = document.createElement("span");
    hint.className = "hint";
    hint.textContent = "留空表示不改密码";
    passwordLabel.append(hint);
  }
  dialog.showModal();
}

function showCoverPreview(src: string): void {
  if (!src) {
    courseCoverPreview.hidden = true;
    courseCoverPreview.removeAttribute("src");
    return;
  }
  courseCoverPreview.src = src;
  courseCoverPreview.hidden = false;
}

function openCourseDialog(course?: Course): void {
  courseDialogError.hidden = true;
  courseForm.reset();
  mustElement<HTMLInputElement>("#course-id").value = course
    ? String(course.id)
    : "";
  mustElement<HTMLHeadingElement>("#course-dialog-title").textContent = course
    ? "编辑课程"
    : "新增课程";
  mustElement<HTMLInputElement>("#course-title").value = course
    ? course.title
    : "";
  mustElement<HTMLTextAreaElement>("#course-summary").value = course
    ? course.summary
    : "";
  mustElement<HTMLInputElement>("#course-teacher").value = course
    ? course.teacher
    : "";
  mustElement<HTMLInputElement>("#course-hours").value = course
    ? String(course.hours)
    : "16";
  mustElement<HTMLSelectElement>("#course-status").value = course
    ? course.status
    : "open";
  courseCoverInput.required = !course;
  showCoverPreview(course ? course.cover : "");
  courseDialog.showModal();
}

function openNoticeDialog(notice?: Notice): void {
  noticeDialogError.hidden = true;
  noticeForm.reset();
  mustElement<HTMLInputElement>("#notice-id").value = notice
    ? String(notice.id)
    : "";
  mustElement<HTMLHeadingElement>("#notice-dialog-title").textContent = notice
    ? "编辑公告"
    : "发布公告";
  mustElement<HTMLInputElement>("#notice-title").value = notice
    ? notice.title
    : "";
  mustElement<HTMLInputElement>("#notice-author").value = notice
    ? notice.author
    : (currentUserLabel.textContent?.split(" · ")[0] ?? "");
  mustElement<HTMLTextAreaElement>("#notice-content").value = notice
    ? notice.content
    : "";
  mustElement<HTMLSelectElement>("#notice-status").value = notice
    ? notice.status
    : "published";
  noticeDialog.showModal();
}

function openStudentDialog(student?: Student): void {
  studentDialogError.hidden = true;
  studentForm.reset();
  mustElement<HTMLInputElement>("#student-id").value = student ? String(student.id) : "";
  mustElement<HTMLHeadingElement>("#student-dialog-title").textContent = student
    ? "编辑学生"
    : "新增学生";
  studentNoInput.value = student ? student.studentNo : "";
  studentNoInput.disabled = Boolean(student);
  mustElement<HTMLInputElement>("#student-name").value = student ? student.name : "";
  mustElement<HTMLSelectElement>("#student-gender").value = student ? student.gender : "male";
  mustElement<HTMLInputElement>("#student-class").value = student ? student.className : "";
  mustElement<HTMLInputElement>("#student-phone").value = student ? student.phone : "";
  mustElement<HTMLSelectElement>("#student-status").value = student ? student.status : "active";
  studentDialog.showModal();
}

async function renderPage(): Promise<void> {
  const page = currentPage();
  pageTitle.textContent = titles[page];
  menuBox.querySelectorAll("a").forEach((link) => {
    link.classList.toggle("active", link.dataset.page === page);
  });

  if (page === "dashboard") return renderDashboard();
  if (page === "users") return renderUsers();
  if (page === "courses") return renderCourses();
  if (page === "notices") return renderNotices();
  if (page === "students") return renderStudents();
  return renderLogs();
}

const me = await request<User>("/api/auth/me");
currentUserLabel.textContent = `${me.name} · ${roleText[me.role]}`;

const menus = await request<MenuItem[]>("/api/menus");
menuBox.innerHTML = menus
  .map(
    (item) =>
      `<a href="#${item.path}" data-page="${item.id}">${item.icon} ${escapeHtml(item.title)}</a>`,
  )
  .join("");

mustElement<HTMLButtonElement>("#logout").addEventListener("click", async () => {
  try {
    await request("/api/auth/logout", { method: "POST" });
  } finally {
    clearToken();
    location.replace("/login.html");
  }
});

function dataValue(target: EventTarget | null, key: string): string | undefined {
  if (!(target instanceof HTMLElement)) return undefined;
  return target.dataset[key];
}

content.addEventListener("click", async (event) => {
  const userEditId = dataValue(event.target, "userEdit");
  const userRemoveId = dataValue(event.target, "userRemove");
  const courseEditId = dataValue(event.target, "courseEdit");
  const courseRemoveId = dataValue(event.target, "courseRemove");
  const noticeEditId = dataValue(event.target, "noticeEdit");
  const noticeRemoveId = dataValue(event.target, "noticeRemove");
  const studentEditId = dataValue(event.target, "studentEdit");
  const studentRemoveId = dataValue(event.target, "studentRemove");

  if (userEditId) {
    const user = await request<User>(`/api/users/${userEditId}`);
    openDialog(user);
  }
  if (userRemoveId && confirm("确定删除这名用户吗？")) {
    try {
      await request(`/api/users/${userRemoveId}`, { method: "DELETE" });
      await renderUsers(document.querySelector<HTMLInputElement>("#keyword")?.value ?? "");
    } catch (error: unknown) {
      alert(errorMessage(error));
    }
  }
  if (courseEditId) {
    const course = await request<Course>(`/api/courses/${courseEditId}`);
    openCourseDialog(course);
  }
  if (courseRemoveId && confirm("确定删除这门课程吗？")) {
    try {
      await request(`/api/courses/${courseRemoveId}`, { method: "DELETE" });
      await renderCourses(
        document.querySelector<HTMLInputElement>("#course-keyword")?.value ?? "",
      );
    } catch (error: unknown) {
      alert(errorMessage(error));
    }
  }
  if (noticeEditId) {
    const notice = await request<Notice>(`/api/notices/${noticeEditId}`);
    openNoticeDialog(notice);
  }
  if (noticeRemoveId && confirm("确定删除这条公告吗？")) {
    try {
      await request(`/api/notices/${noticeRemoveId}`, { method: "DELETE" });
      await renderNotices(
        document.querySelector<HTMLInputElement>("#notice-keyword")?.value ?? "",
      );
    } catch (error: unknown) {
      alert(errorMessage(error));
    }
  }
  if (studentEditId) {
    const student = await request<Student>(`/api/students/${studentEditId}`);
    openStudentDialog(student);
  }
  if (studentRemoveId && confirm("确定删除这名学生吗？")) {
    try {
      await request(`/api/students/${studentRemoveId}`, { method: "DELETE" });
      await renderStudents(
        document.querySelector<HTMLInputElement>("#student-keyword")?.value ?? "",
      );
    } catch (error: unknown) {
      alert(errorMessage(error));
    }
  }
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  dialogError.hidden = true;
  const id = mustElement<HTMLInputElement>("#user-id").value;
  const payload: UserPayload = {
    username: usernameInput.value,
    password: mustElement<HTMLInputElement>("#user-password").value,
    name: mustElement<HTMLInputElement>("#user-name").value,
    email: mustElement<HTMLInputElement>("#user-email").value,
    role: mustElement<HTMLSelectElement>("#user-role").value as UserRole,
    status: mustElement<HTMLSelectElement>("#user-status").value as UserStatus,
  };
  try {
    await request(id ? `/api/users/${id}` : "/api/users", {
      method: id ? "PUT" : "POST",
      body: JSON.stringify(payload),
    });
    dialog.close();
    await renderUsers(document.querySelector<HTMLInputElement>("#keyword")?.value ?? "");
  } catch (error: unknown) {
    dialogError.textContent = errorMessage(error);
    dialogError.hidden = false;
  }
});

courseCoverInput.addEventListener("change", () => {
  const file = courseCoverInput.files?.[0];
  if (!file) return;
  showCoverPreview(URL.createObjectURL(file));
});

function readCoverAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
        return;
      }
      reject(new Error("封面读取失败"));
    };
    reader.onerror = () => reject(new Error("封面读取失败"));
    reader.readAsDataURL(file);
  });
}

courseForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  courseDialogError.hidden = true;
  const id = mustElement<HTMLInputElement>("#course-id").value;
  const payload: CoursePayload = {
    title: mustElement<HTMLInputElement>("#course-title").value,
    summary: mustElement<HTMLTextAreaElement>("#course-summary").value,
    teacher: mustElement<HTMLInputElement>("#course-teacher").value,
    hours: mustElement<HTMLInputElement>("#course-hours").value,
    status: mustElement<HTMLSelectElement>("#course-status").value as CourseStatus,
  };
  const file = courseCoverInput.files?.[0];
  try {
    if (file) payload.coverData = await readCoverAsDataUrl(file);
    await request(id ? `/api/courses/${id}` : "/api/courses", {
      method: id ? "PUT" : "POST",
      body: JSON.stringify(payload),
    });
    courseDialog.close();
    await renderCourses(
      document.querySelector<HTMLInputElement>("#course-keyword")?.value ?? "",
    );
  } catch (error: unknown) {
    courseDialogError.textContent = errorMessage(error);
    courseDialogError.hidden = false;
  }
});

noticeForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  noticeDialogError.hidden = true;
  const id = mustElement<HTMLInputElement>("#notice-id").value;
  const payload: NoticePayload = {
    title: mustElement<HTMLInputElement>("#notice-title").value,
    author: mustElement<HTMLInputElement>("#notice-author").value,
    content: mustElement<HTMLTextAreaElement>("#notice-content").value,
    status: mustElement<HTMLSelectElement>("#notice-status").value as NoticeStatus,
  };
  try {
    await request(id ? `/api/notices/${id}` : "/api/notices", {
      method: id ? "PUT" : "POST",
      body: JSON.stringify(payload),
    });
    noticeDialog.close();
    await renderNotices(
      document.querySelector<HTMLInputElement>("#notice-keyword")?.value ?? "",
    );
  } catch (error: unknown) {
    noticeDialogError.textContent = errorMessage(error);
    noticeDialogError.hidden = false;
  }
});

studentForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  studentDialogError.hidden = true;
  const id = mustElement<HTMLInputElement>("#student-id").value;
  const payload: StudentPayload = {
    studentNo: studentNoInput.value,
    name: mustElement<HTMLInputElement>("#student-name").value,
    gender: mustElement<HTMLSelectElement>("#student-gender").value as StudentGender,
    className: mustElement<HTMLInputElement>("#student-class").value,
    phone: mustElement<HTMLInputElement>("#student-phone").value,
    status: mustElement<HTMLSelectElement>("#student-status").value as StudentStatus,
  };
  try {
    await request(id ? `/api/students/${id}` : "/api/students", {
      method: id ? "PUT" : "POST",
      body: JSON.stringify(payload),
    });
    studentDialog.close();
    await renderStudents(
      document.querySelector<HTMLInputElement>("#student-keyword")?.value ?? "",
    );
  } catch (error: unknown) {
    studentDialogError.textContent = errorMessage(error);
    studentDialogError.hidden = false;
  }
});

mustElement<HTMLButtonElement>("#dialog-cancel").addEventListener("click", () => {
  dialog.close();
});
mustElement<HTMLButtonElement>("#course-dialog-cancel").addEventListener(
  "click",
  () => {
    courseDialog.close();
  },
);
mustElement<HTMLButtonElement>("#notice-dialog-cancel").addEventListener(
  "click",
  () => {
    noticeDialog.close();
  },
);

mustElement<HTMLButtonElement>("#student-dialog-cancel").addEventListener(
  "click",
  () => {
    studentDialog.close();
  },
);

window.addEventListener("hashchange", () => {
  void renderPage().catch((error: unknown) => {
    content.textContent = errorMessage(error);
  });
});

await renderPage();
