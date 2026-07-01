import mongoose from 'mongoose';

const baseOptions = { strict: true, timestamps: true };

const generateId = () => Math.random().toString(36).substring(2, 9) + Date.now().toString(36);

export const UserSchema = new mongoose.Schema({
  _id: { type: String, default: generateId },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, required: true },
  name: { type: String, required: true },
  employeeId: { type: String, index: true },
  failedLoginAttempts: { type: Number, default: 0 },
  locked: { type: Boolean, default: false },
  refreshToken: { type: String }
}, baseOptions);

export const EmployeeSchema = new mongoose.Schema({
  _id: { type: String, default: generateId },
  employeeId: { type: String, required: true, unique: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  mobile: { type: String },
  address: { type: String },
  gender: { type: String },
  bloodGroup: { type: String },
  dob: { type: String },
  department: { type: String, index: true },
  designation: { type: String },
  joiningDate: { type: String },
  reportingManager: { type: String, index: true },
  employmentType: { type: String },
  salaryGrade: { type: String },
  basicSalary: { type: Number },
  hra: { type: Number },
  status: { type: String, index: true, default: 'Active' }
}, baseOptions);

export const DepartmentSchema = new mongoose.Schema({
  _id: { type: String, default: generateId },
  departmentName: { type: String, required: true },
  departmentCode: { type: String, required: true, unique: true },
  manager: { type: String },
  employees: { type: Number, default: 0 },
  status: { type: String, default: 'Active' }
}, baseOptions);

export const CandidateSchema = new mongoose.Schema({
  _id: { type: String, default: generateId },
  candidateName: { type: String, required: true },
  email: { type: String, required: true },
  experience: { type: Number },
  skills: [{ type: String }],
  status: { type: String },
  resumeFileName: { type: String },
  interviewNotes: { type: String }
}, baseOptions);

export const AttendanceSchema = new mongoose.Schema({
  _id: { type: String, default: generateId },
  employeeId: { type: String, required: true, index: true },
  date: { type: String, required: true },
  clockIn: { type: String },
  clockOut: { type: String },
  workingHours: { type: Number, default: 0 },
  status: { type: String },
  overtime: { type: Number, default: 0 },
  location: { type: String }
}, baseOptions);

// Compound unique index to prevent duplicate attendance records for same employee on same day
AttendanceSchema.index({ employeeId: 1, date: 1 }, { unique: true });

export const LeaveSchema = new mongoose.Schema({
  _id: { type: String, default: generateId },
  employeeId: { type: String, required: true, index: true },
  leaveType: { type: String, required: true },
  startDate: { type: String, required: true },
  endDate: { type: String, required: true },
  reason: { type: String },
  status: { type: String, index: true, default: 'Pending' },
  approvedBy: { type: String }
}, baseOptions);

export const PayrollSchema = new mongoose.Schema({
  _id: { type: String, default: generateId },
  employeeId: { type: String, required: true, index: true },
  month: { type: String, required: true },
  basicSalary: { type: Number },
  hra: { type: Number },
  bonus: { type: Number },
  overtime: { type: Number },
  deductions: { type: Number },
  netSalary: { type: Number },
  pf: { type: Number },
  professionalTax: { type: Number },
  absentDays: { type: Number },
  overtimeHours: { type: Number },
  status: { type: String },
  processedDate: { type: String }
}, baseOptions);

// Compound unique index for payroll
PayrollSchema.index({ employeeId: 1, month: 1 }, { unique: true });

export const ProjectSchema = new mongoose.Schema({
  _id: { type: String, default: generateId },
  projectName: { type: String, required: true },
  description: { type: String },
  manager: { type: String, index: true },
  status: { type: String },
  deadline: { type: String }
}, baseOptions);

export const TaskSchema = new mongoose.Schema({
  _id: { type: String, default: generateId },
  projectId: { type: String, required: true, index: true },
  project: { type: String },
  task: { type: String, required: true },
  assignedTo: { type: String, index: true },
  priority: { type: String },
  status: { type: String },
  deadline: { type: String }
}, baseOptions);

export const AssetSchema = new mongoose.Schema({
  _id: { type: String, default: generateId },
  assetName: { type: String, required: true },
  serialNumber: { type: String, required: true, unique: true },
  type: { type: String },
  assignedTo: { type: String, index: true },
  status: { type: String },
  assignedDate: { type: String }
}, baseOptions);

export const TicketSchema = new mongoose.Schema({
  _id: { type: String, default: generateId },
  employeeId: { type: String, required: true, index: true },
  title: { type: String, required: true },
  description: { type: String },
  priority: { type: String },
  status: { type: String, index: true, default: 'Open' },
  assignedTo: { type: String, index: true }
}, baseOptions);

export const NotificationSchema = new mongoose.Schema({
  _id: { type: String, default: generateId },
  recipientId: { type: String, required: true, index: true },
  message: { type: String, required: true },
  read: { type: Boolean, default: false },
}, baseOptions);

export const AuditLogSchema = new mongoose.Schema({
  _id: { type: String, default: generateId },
  userId: { type: String, required: true, index: true },
  action: { type: String, required: true },
  details: { type: String },
}, baseOptions);

export const CounterSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  sequence_value: { type: Number, default: 0 }
}, baseOptions);
