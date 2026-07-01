import { db } from '../db.js';

export class AssetService {
  static async getAssets({ userRole, userEmployeeId, page = 1, limit = 50 }) {
    const isIT = ['SUPER_ADMIN', 'HR', 'IT'].includes(userRole);
    
    let query = {};
    if (!isIT) {
      if (!userEmployeeId) {
        throw new Error('User profile not linked to an employee.');
      }
      query.assignedTo = userEmployeeId;
    }

    const { data: allAssets, meta } = await db.assets.findPaginated(query, page, limit);
    
    // Resolve N+1 query
    const assigneeIds = [...new Set(allAssets.map(a => a.assignedTo).filter(Boolean))];
    const employees = await db.employees.find({ employeeId: { $in: assigneeIds } });
    
    const empMap = employees.reduce((acc, emp) => {
      acc[emp.employeeId] = `${emp.firstName} ${emp.lastName}`;
      return acc;
    }, {});

    const enrichedAssets = allAssets.map(asset => ({
      ...asset,
      assigneeName: empMap[asset.assignedTo] || 'Unassigned'
    }));

    return { assets: enrichedAssets, meta };
  }

  static async createAsset({ assetName, serialNumber, type, assignedTo, status }) {
    if (!assetName || !serialNumber || !type) {
      throw new Error('Asset Name, Serial Number, and Type are required.');
    }

    return await db.assets.create({
      assetName,
      serialNumber,
      type,
      assignedTo: assignedTo || '',
      status: status || (assignedTo ? 'Assigned' : 'Available'),
      assignedDate: assignedTo ? new Date().toISOString().split('T')[0] : ''
    });
  }

  static async updateAsset(id, updateFields) {
    const asset = await db.assets.findById(id);
    if (!asset) {
      throw new Error('Asset not found.');
    }

    if (updateFields.assignedTo && updateFields.assignedTo !== asset.assignedTo) {
      updateFields.assignedDate = new Date().toISOString().split('T')[0];
      updateFields.status = 'Assigned';

      await db.notifications.create({
        recipientId: updateFields.assignedTo,
        message: `A new asset (${asset.assetName} - SN: ${asset.serialNumber}) has been assigned to you.`,
        read: false,
        createdAt: new Date().toISOString()
      });
    } else if (updateFields.assignedTo === '') {
      updateFields.assignedDate = '';
      updateFields.status = 'Available';
    }

    return await db.assets.findByIdAndUpdate(id, updateFields);
  }
}
