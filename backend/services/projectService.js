import { db } from '../db.js';

export class ProjectService {
  static async getAllProjects({ page = 1, limit = 50 }) {
    const { data: projects, meta } = await db.projects.findPaginated({}, page, limit);
    
    const managerIds = [...new Set(projects.map(p => p.manager).filter(Boolean))];
    const managers = await db.employees.find({ employeeId: { $in: managerIds } });
    
    const managerMap = managers.reduce((acc, mgr) => {
      acc[mgr.employeeId] = `${mgr.firstName} ${mgr.lastName}`;
      return acc;
    }, {});

    const enrichedProjects = projects.map(proj => ({
      ...proj,
      managerName: managerMap[proj.manager] || 'N/A'
    }));

    return { projects: enrichedProjects, meta };
  }

  static async createProject({ projectName, description, manager, deadline }) {
    return await db.projects.create({
      projectName,
      description: description || '',
      manager: manager || '',
      status: 'In Progress',
      deadline
    });
  }

  static async getTasks({ projectId, assignedTo, userRole, userEmployeeId, page = 1, limit = 50 }) {
    const query = {};

    if (projectId) {
      query.projectId = projectId;
    }
    if (assignedTo) {
      query.assignedTo = assignedTo;
    } else if (userRole === 'EMPLOYEE') {
      query.assignedTo = userEmployeeId;
    }

    const { data: list, meta } = await db.tasks.findPaginated(query, page, limit);

    const assigneeIds = [...new Set(list.map(t => t.assignedTo).filter(Boolean))];
    const assignees = await db.employees.find({ employeeId: { $in: assigneeIds } });
    
    const assigneeMap = assignees.reduce((acc, emp) => {
      acc[emp.employeeId] = `${emp.firstName} ${emp.lastName}`;
      return acc;
    }, {});

    const enrichedTasks = list.map(t => ({
      ...t,
      assigneeName: assigneeMap[t.assignedTo] || 'Unassigned'
    }));

    return { tasks: enrichedTasks, meta };
  }

  static async createTask({ projectId, task, assignedTo, priority, deadline }) {
    const projectRecord = await db.projects.findById(projectId);
    if (!projectRecord) {
      throw new Error('Project not found.');
    }

    const newTask = await db.tasks.create({
      projectId,
      project: projectRecord.projectName,
      task,
      assignedTo,
      priority: priority || 'Medium',
      status: 'To Do',
      deadline,
      comments: [],
      attachments: []
    });

    await db.notifications.create({
      recipientId: assignedTo,
      message: `You have been assigned a new task: "${task}" under project "${projectRecord.projectName}"`,
      read: false,
      createdAt: new Date().toISOString()
    });

    return newTask;
  }

  static async updateTaskStatus(taskId, { status, comments, attachments, userRole, userName }) {
    const currentTask = await db.tasks.findById(taskId);
    if (!currentTask) {
      throw new Error('Task not found.');
    }

    if (currentTask.status === 'Completed') {
      throw new Error('Completed tasks are locked and read-only.');
    }

    const isEmployee = userRole === 'EMPLOYEE';
    if (status === 'Completed' && isEmployee && currentTask.status !== 'Review') {
      throw new Error('Task must be moved to "Review" status first for manager approval.');
    }

    const updateFields = {};
    if (status) updateFields.status = status;
    
    if (comments) {
      updateFields.comments = [...(currentTask.comments || []), {
        author: userName,
        text: comments,
        timestamp: new Date().toISOString()
      }];
    }

    if (attachments) {
      updateFields.attachments = [...(currentTask.attachments || []), attachments];
    }

    const updated = await db.tasks.findByIdAndUpdate(taskId, updateFields);

    if (status === 'Completed') {
      const project = await db.projects.findById(currentTask.projectId);
      if (project && project.manager) {
        await db.notifications.create({
          recipientId: project.manager,
          message: `Task "${currentTask.task}" has been completed by ${userName}.`,
          read: false,
          createdAt: new Date().toISOString()
        });
      }
    }

    return updated;
  }
}
