import { z } from 'zod';

export const createEmployeeSchema = {
  body: z.object({
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    email: z.string().email("Invalid email address"),
    mobile: z.string().optional(),
    address: z.string().optional(),
    gender: z.enum(['Male', 'Female', 'Other']).optional(),
    bloodGroup: z.string().optional(),
    dob: z.string().optional(),
    department: z.string().optional(),
    designation: z.string().optional(),
    joiningDate: z.string().min(1, "Joining date is required"),
    reportingManager: z.string().optional(),
    employmentType: z.enum(['Permanent', 'Contract', 'Probation']).optional(),
    salaryGrade: z.string().optional(),
    basicSalary: z.union([z.number(), z.string()]).optional(),
    hra: z.union([z.number(), z.string()]).optional(),
  })
};

export const updateEmployeeSchema = {
  body: z.object({
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    email: z.string().email().optional(),
    mobile: z.string().optional(),
    address: z.string().optional(),
    gender: z.enum(['Male', 'Female', 'Other']).optional(),
    bloodGroup: z.string().optional(),
    dob: z.string().optional(),
    department: z.string().optional(),
    designation: z.string().optional(),
    joiningDate: z.string().optional(),
    reportingManager: z.string().optional(),
    employmentType: z.enum(['Permanent', 'Contract', 'Probation']).optional(),
    salaryGrade: z.string().optional(),
    basicSalary: z.union([z.number(), z.string()]).optional(),
    hra: z.union([z.number(), z.string()]).optional(),
  })
};
