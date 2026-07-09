import mongoose from 'mongoose';
import config from './config/index.js';

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

/**
 * Connect to MongoDB. MUST be awaited before any database operation.
 * Uses connection caching for Vercel serverless — avoids opening
 * a new connection on every invocation.
 */
export async function connectDB() {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,       // Fail fast instead of buffering for 10s
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      family: 4,                   // Force IPv4 — fixes Vercel DNS issues
    };
    console.log('[DB] Connecting to MongoDB...');
    cached.promise = mongoose.connect(config.mongoUri, opts)
      .then((m) => {
        console.log('[DB] Connected to MongoDB successfully.');
        return m;
      })
      .catch((err) => {
        console.error('[DB] MongoDB connection failed:', err.message);
        cached.promise = null;      // Allow retry on next request
        throw err;
      });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}

import {
  UserSchema,
  EmployeeSchema,
  DepartmentSchema,
  CandidateSchema,
  AttendanceSchema,
  LeaveSchema,
  PayrollSchema,
  ProjectSchema,
  TaskSchema,
  AssetSchema,
  TicketSchema,
  NotificationSchema,
  AuditLogSchema,
  CounterSchema
} from './models/schemas.js';

class MongooseWrapper {
  constructor(modelName, schema) {
    this.model = mongoose.model(modelName, schema);
  }

  async find(query = {}) {
    return this.model.find(query).lean();
  }

  async findPaginated(query = {}, page = 1, limit = 50, sort = { createdAt: -1 }) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.model.find(query).sort(sort).skip(skip).limit(limit).lean(),
      this.model.countDocuments(query)
    ]);
    return {
      data,
      meta: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async findOne(query = {}) {
    return this.model.findOne(query).lean();
  }

  async findById(id) {
    return this.model.findOne({ $or: [{ _id: id }, { id: id }] }).lean();
  }

  async create(doc, options = {}) {
    const created = await this.model.create([doc], options);
    return created[0].toObject(); 
  }

  async findByIdAndUpdate(id, updateData, options = {}) {
    return this.model.findOneAndUpdate(
      { $or: [{ _id: id }, { id: id }] },
      updateData,
      { new: true, lean: true, ...options }
    );
  }

  async updateOne(query, updateData, options = {}) {
    return this.model.findOneAndUpdate(query, updateData, { new: true, lean: true, ...options });
  }

  async deleteMany(query = {}) {
    return this.model.deleteMany(query);
  }

  async deleteOne(query = {}) {
    return this.model.deleteOne(query);
  }
  
  async insertMany(docs) {
    return this.model.insertMany(docs);
  }
}

export const db = {
  users: new MongooseWrapper('User', UserSchema),
  employees: new MongooseWrapper('Employee', EmployeeSchema),
  departments: new MongooseWrapper('Department', DepartmentSchema),
  candidates: new MongooseWrapper('Candidate', CandidateSchema),
  attendance: new MongooseWrapper('Attendance', AttendanceSchema),
  leaves: new MongooseWrapper('Leave', LeaveSchema),
  payroll: new MongooseWrapper('Payroll', PayrollSchema),
  projects: new MongooseWrapper('Project', ProjectSchema),
  tasks: new MongooseWrapper('Task', TaskSchema),
  assets: new MongooseWrapper('Asset', AssetSchema),
  tickets: new MongooseWrapper('Ticket', TicketSchema),
  notifications: new MongooseWrapper('Notification', NotificationSchema),
  auditLogs: new MongooseWrapper('AuditLog', AuditLogSchema),
  counters: new MongooseWrapper('Counter', CounterSchema)
};

/**
 * Executes a callback within a MongoDB transaction.
 * Requires a MongoDB Replica Set.
 */
export const withTransaction = async (callback) => {
  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      result = await callback(session);
    });
    return result;
  } catch (error) {
    console.error('Transaction aborted:', error);
    throw error;
  } finally {
    await session.endSession();
  }
};
