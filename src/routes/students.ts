/**
 * 学生接口。学号新增时唯一，编辑时不可改。成功后 writeLog。
 */
import { Router } from "express";
import { queryText } from "@/query";
import { writeLog } from "@/repositories/log-repository";
import {
  create,
  findAll,
  findById,
  findByStudentNo,
  remove,
  update,
} from "@/repositories/student-repository";
import type {
  CreateStudentInput,
  StudentGender,
  StudentStatus,
  UpdateStudentInput,
} from "@/types";

export const studentsRouter = Router();

const genders = new Set<StudentGender>(["male", "female"]);
const statuses = new Set<StudentStatus>(["active", "disabled"]);

function isStudentGender(value: unknown): value is StudentGender {
  return typeof value === "string" && genders.has(value as StudentGender);
}

function isStudentStatus(value: unknown): value is StudentStatus {
  return typeof value === "string" && statuses.has(value as StudentStatus);
}

function valid(
  body: Record<string, unknown>,
  options: { requireStudentNo: boolean },
): string {
  const { studentNo, name, gender, className, phone, status } = body;

  if (typeof name !== "string" || !name.trim()) return "姓名不能为空";
  if (!isStudentGender(gender)) return "性别只能是 male 或 female";
  if (typeof className !== "string" || !className.trim()) return "班级不能为空";
  if (typeof phone !== "string" || !phone.trim()) return "联系电话不能为空";
  if (!isStudentStatus(status)) return "状态只能是 active 或 disabled";

  if (options.requireStudentNo) {
    if (typeof studentNo !== "string" || !studentNo.trim()) {
      return "学号不能为空";
    }
  }

  return "";
}

studentsRouter.get("/", (request, response) => {
  response.json(findAll(queryText(request.query.keyword)));
});

studentsRouter.get("/:id", (request, response) => {
  const item = findById(request.params.id);
  item
    ? response.json(item)
    : response.status(404).json({ message: "学生不存在" });
});

studentsRouter.post("/", (request, response) => {
  const body = request.body as Record<string, unknown>;
  const message = valid(body, { requireStudentNo: true });
  if (message) {
    response.status(400).json({ message });
    return;
  }

  const studentNo = String(body.studentNo).trim();
  if (findByStudentNo(studentNo)) {
    response.status(409).json({ message: "学号已存在" });
    return;
  }

  const payload: CreateStudentInput = {
    studentNo,
    name: String(body.name),
    gender: body.gender as StudentGender,
    className: String(body.className),
    phone: String(body.phone),
    status: body.status as StudentStatus,
  };
  const item = create(payload);
  writeLog({
    actorName: request.user.name,
    module: "学生",
    action: "新增",
    detail: item.studentNo,
  });
  response.status(201).json(item);
});

studentsRouter.put("/:id", (request, response) => {
  const body = request.body as Record<string, unknown>;
  const message = valid(body, { requireStudentNo: false });
  if (message) {
    response.status(400).json({ message });
    return;
  }

  const payload: UpdateStudentInput = {
    name: String(body.name),
    gender: body.gender as StudentGender,
    className: String(body.className),
    phone: String(body.phone),
    status: body.status as StudentStatus,
  };
  const item = update(request.params.id, payload);
  if (!item) {
    response.status(404).json({ message: "学生不存在" });
    return;
  }

  writeLog({
    actorName: request.user.name,
    module: "学生",
    action: "修改",
    detail: item.studentNo,
  });
  response.json(item);
});

studentsRouter.delete("/:id", (request, response) => {
  const current = findById(request.params.id);
  if (!current) {
    response.status(404).json({ message: "学生不存在" });
    return;
  }

  remove(request.params.id);
  writeLog({
    actorName: request.user.name,
    module: "学生",
    action: "删除",
    detail: current.studentNo,
  });
  response.status(204).end();
});
