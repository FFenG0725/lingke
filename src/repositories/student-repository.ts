/**
 * 学生仓库。学号唯一，新增时按学号查重；编辑时学号不可改。
 */
import { mockStudents } from "@/data/mock-students";
import type {
  CreateStudentInput,
  Student,
  UpdateStudentInput,
} from "@/types";

let nextId = 1;
for (const student of mockStudents) {
  if (student.id >= nextId) {
    nextId = student.id + 1;
  }
}

function copyStudent(student: Student): Student {
  return { ...student };
}

function toNumber(id: string | number): number {
  return Number(id);
}

export function findAll(keyword = ""): Student[] {
  const text = keyword.trim().toLowerCase();
  const result: Student[] = [];

  for (const student of mockStudents) {
    const inStudentNo = student.studentNo.toLowerCase().includes(text);
    const inName = student.name.toLowerCase().includes(text);
    if (!text || inStudentNo || inName) {
      result.push(copyStudent(student));
    }
  }

  result.sort((left, right) => right.id - left.id);
  return result;
}

export function findById(id: string | number): Student | null {
  const numberId = toNumber(id);
  for (const student of mockStudents) {
    if (student.id === numberId) {
      return copyStudent(student);
    }
  }
  return null;
}

export function findByStudentNo(studentNo: string): Student | null {
  for (const student of mockStudents) {
    if (student.studentNo === studentNo) {
      return copyStudent(student);
    }
  }
  return null;
}

export function create(data: CreateStudentInput): Student {
  const item: Student = {
    id: nextId,
    studentNo: data.studentNo.trim(),
    name: data.name.trim(),
    gender: data.gender,
    className: data.className.trim(),
    phone: data.phone.trim(),
    status: data.status,
    createdAt: new Date().toISOString(),
  };
  nextId += 1;
  mockStudents.push(item);
  return copyStudent(item);
}

export function update(
  id: string | number,
  data: UpdateStudentInput,
): Student | null {
  const numberId = toNumber(id);
  const index = mockStudents.findIndex((student) => student.id === numberId);
  if (index === -1) {
    return null;
  }

  const oldItem = mockStudents[index];
  mockStudents[index] = {
    id: oldItem.id,
    createdAt: oldItem.createdAt,
    studentNo: oldItem.studentNo,
    name: data.name.trim(),
    gender: data.gender,
    className: data.className.trim(),
    phone: data.phone.trim(),
    status: data.status,
  };
  return copyStudent(mockStudents[index]);
}

export function remove(id: string | number): boolean {
  const numberId = toNumber(id);
  const index = mockStudents.findIndex((student) => student.id === numberId);
  if (index === -1) {
    return false;
  }
  mockStudents.splice(index, 1);
  return true;
}

export function countStudents(): number {
  return mockStudents.length;
}
