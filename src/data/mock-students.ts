/**
 * 学生 Mock 数据。学号唯一，供仓库层查重。
 */
import type { Student } from "@/types";

export const mockStudents: Student[] = [
  {
    id: 1,
    studentNo: "20260001",
    name: "张伟",
    gender: "male",
    className: "前端班 1 期",
    phone: "13800000001",
    status: "active",
    createdAt: "2026-03-05T09:00:00.000Z",
  },
  {
    id: 2,
    studentNo: "20260002",
    name: "李娜",
    gender: "female",
    className: "前端班 1 期",
    phone: "13800000002",
    status: "active",
    createdAt: "2026-03-06T10:00:00.000Z",
  },
  {
    id: 3,
    studentNo: "20260003",
    name: "王强",
    gender: "male",
    className: "Node 班 1 期",
    phone: "13800000003",
    status: "disabled",
    createdAt: "2026-03-10T14:00:00.000Z",
  },
];
