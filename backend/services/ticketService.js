import { db } from '../db.js';

export class TicketService {
  static async getTickets({ userRole, userEmployeeId, page = 1, limit = 50 }) {
    const isIT = ['SUPER_ADMIN', 'HR', 'IT'].includes(userRole);
    
    let query = {};
    if (!isIT) {
      if (!userEmployeeId) {
        throw new Error('User profile not linked to an employee.');
      }
      query.employeeId = userEmployeeId;
    }

    const { data: allTickets, meta } = await db.tickets.findPaginated(query, page, limit);
    
    // Resolve N+1 query
    const employeeIds = [...new Set(allTickets.map(t => t.employeeId).filter(Boolean))];
    const employees = await db.employees.find({ employeeId: { $in: employeeIds } });
    
    const empMap = employees.reduce((acc, emp) => {
      acc[emp.employeeId] = `${emp.firstName} ${emp.lastName}`;
      return acc;
    }, {});

    const enrichedTickets = allTickets.map(tkt => ({
      ...tkt,
      requesterName: empMap[tkt.employeeId] || 'System User'
    }));

    return { tickets: enrichedTickets, meta };
  }

  static async createTicket({ title, description, priority, employeeId }) {
    if (!employeeId) {
      throw new Error('User profile not linked to an employee.');
    }
    if (!title || !description) {
      throw new Error('Title and Description are required');
    }

    const newTicket = await db.tickets.create({
      employeeId,
      title,
      description,
      priority: priority || 'Medium',
      status: 'Open',
      assignedTo: '',
      createdAt: new Date().toISOString()
    });

    const itUsers = await db.users.find({ role: 'IT' });
    const notifications = itUsers.map(it => ({
      recipientId: it.employeeId || it._id,
      message: `New Help Desk ticket raised: "${title}"`,
      read: false,
      createdAt: new Date().toISOString()
    }));
    
    for (const notif of notifications) {
      await db.notifications.create(notif);
    }

    return newTicket;
  }

  static async updateTicket(id, { status, assignedTo }) {
    const ticket = await db.tickets.findById(id);
    if (!ticket) {
      throw new Error('Ticket not found.');
    }

    const updateFields = {};
    if (status) updateFields.status = status;
    if (assignedTo !== undefined) updateFields.assignedTo = assignedTo;

    const updated = await db.tickets.findByIdAndUpdate(id, updateFields);

    await db.notifications.create({
      recipientId: ticket.employeeId,
      message: `Your IT support ticket "${ticket.title}" status has been updated to "${status || ticket.status}"`,
      read: false,
      createdAt: new Date().toISOString()
    });

    return updated;
  }
}
