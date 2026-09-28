/**
 * 左侧菜单由接口下发，页面按这份数据渲染。
 */
import type { MenuItem } from "@/types";

export const menus: MenuItem[] = [
  { id: "dashboard", title: "工作台", path: "/dashboard", icon: "▣" },
  { id: "users", title: "用户管理", path: "/users", icon: "◎" },
  { id: "courses", title: "课程管理", path: "/courses", icon: "▤" },
  { id: "students", title: "学生管理", path: "/students", icon: "★" },
  { id: "notices", title: "公告管理", path: "/notices", icon: "✉" },
  { id: "logs", title: "操作日志", path: "/logs", icon: "☰" },
];
