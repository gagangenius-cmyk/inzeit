import { sequelize } from '../lib/sequelize';
import { 
  Lead, 
  Employee, 
  Branch, 
  Region, 
  Program, 
  Fee, 
  Currency, 
  Role, 
  MarketSource 
} from '../models';

// Database service for handling all database operations
class DatabaseService {
  // Lead operations
  static async getAllLeads() {
    try {
      const leads = await Lead.findAll({
        include: [
          { association: 'assignedEmployee', attributes: ['id', 'name'] },
          { association: 'branchInfo', attributes: ['id', 'name'] },
          { association: 'regionInfo', attributes: ['id', 'name'] },
          { association: 'programInfo', attributes: ['id', 'name'] },
          { association: 'marketSourceInfo', attributes: ['id', 'name'] }
        ],
        order: [['id', 'DESC']]
      });
      return leads;
    } catch (error) {
      console.error('Error fetching leads:', error);
      throw error;
    }
  }

  static async getLeadById(id: number) {
    try {
      const lead = await Lead.findByPk(id, {
        include: [
          { association: 'assignedEmployee' },
          { association: 'branchInfo' },
          { association: 'regionInfo' },
          { association: 'programInfo' },
          { association: 'marketSourceInfo' }
        ]
      });
      return lead;
    } catch (error) {
      console.error('Error fetching lead:', error);
      throw error;
    }
  }

  static async createLead(leadData: any) {
    try {
      const lead = await Lead.create(leadData);
      return lead;
    } catch (error) {
      console.error('Error creating lead:', error);
      throw error;
    }
  }

  static async updateLead(id: number, leadData: any) {
    try {
      const lead = await Lead.findByPk(id);
      if (lead) {
        await lead.update(leadData);
        return lead;
      }
      return null;
    } catch (error) {
      console.error('Error updating lead:', error);
      throw error;
    }
  }

  static async deleteLead(id: number) {
    try {
      const lead = await Lead.findByPk(id);
      if (lead) {
        await lead.destroy();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error deleting lead:', error);
      throw error;
    }
  }

  // Employee operations
  static async getAllEmployees() {
    try {
      const employees = await Employee.findAll({
        include: [
          { association: 'branchInfo', attributes: ['id', 'name'] },
          { association: 'regionInfo', attributes: ['id', 'name'] },
          { association: 'roleInfo', attributes: ['id', 'name'] }
        ],
        order: [['id', 'DESC']]
      });
      return employees;
    } catch (error) {
      console.error('Error fetching employees:', error);
      throw error;
    }
  }

  static async getEmployeeById(id: number) {
    try {
      const employee = await Employee.findByPk(id, {
        include: [
          { association: 'branchInfo' },
          { association: 'regionInfo' },
          { association: 'roleInfo' }
        ]
      });
      return employee;
    } catch (error) {
      console.error('Error fetching employee:', error);
      throw error;
    }
  }

  static async createEmployee(employeeData: any) {
    try {
      const employee = await Employee.create(employeeData);
      return employee;
    } catch (error) {
      console.error('Error creating employee:', error);
      throw error;
    }
  }

  static async updateEmployee(id: number, employeeData: any) {
    try {
      const employee = await Employee.findByPk(id);
      if (employee) {
        await employee.update(employeeData);
        return employee;
      }
      return null;
    } catch (error) {
      console.error('Error updating employee:', error);
      throw error;
    }
  }

  static async deleteEmployee(id: number) {
    try {
      const employee = await Employee.findByPk(id);
      if (employee) {
        await employee.destroy();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error deleting employee:', error);
      throw error;
    }
  }

  // Program operations
  static async getAllPrograms() {
    try {
      const programs = await Program.findAll({
        order: [['id', 'DESC']]
      });
      return programs;
    } catch (error) {
      console.error('Error fetching programs:', error);
      throw error;
    }
  }

  static async getProgramById(id: number) {
    try {
      const program = await Program.findByPk(id);
      return program;
    } catch (error) {
      console.error('Error fetching program:', error);
      throw error;
    }
  }

  static async createProgram(programData: any) {
    try {
      const program = await Program.create(programData);
      return program;
    } catch (error) {
      console.error('Error creating program:', error);
      throw error;
    }
  }

  static async updateProgram(id: number, programData: any) {
    try {
      const program = await Program.findByPk(id);
      if (program) {
        await program.update(programData);
        return program;
      }
      return null;
    } catch (error) {
      console.error('Error updating program:', error);
      throw error;
    }
  }

  static async deleteProgram(id: number) {
    try {
      const program = await Program.findByPk(id);
      if (program) {
        await program.destroy();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error deleting program:', error);
      throw error;
    }
  }

  // Fee operations
  static async getAllFees() {
    try {
      const fees = await Fee.findAll({
        include: [
          { association: 'programInfo', attributes: ['id', 'name'] },
          { association: 'currencyInfo', attributes: ['id', 'code', 'symbol'] }
        ],
        order: [['id', 'DESC']]
      });
      return fees;
    } catch (error) {
      console.error('Error fetching fees:', error);
      throw error;
    }
  }

  static async getFeeById(id: number) {
    try {
      const fee = await Fee.findByPk(id, {
        include: [
          { association: 'programInfo' },
          { association: 'currencyInfo' }
        ]
      });
      return fee;
    } catch (error) {
      console.error('Error fetching fee:', error);
      throw error;
    }
  }

  static async createFee(feeData: any) {
    try {
      const fee = await Fee.create(feeData);
      return fee;
    } catch (error) {
      console.error('Error creating fee:', error);
      throw error;
    }
  }

  static async updateFee(id: number, feeData: any) {
    try {
      const fee = await Fee.findByPk(id);
      if (fee) {
        await fee.update(feeData);
        return fee;
      }
      return null;
    } catch (error) {
      console.error('Error updating fee:', error);
      throw error;
    }
  }

  static async deleteFee(id: number) {
    try {
      const fee = await Fee.findByPk(id);
      if (fee) {
        await fee.destroy();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error deleting fee:', error);
      throw error;
    }
  }

  // Currency operations
  static async getAllCurrencies() {
    try {
      const currencies = await Currency.findAll({
        order: [['id', 'DESC']]
      });
      return currencies;
    } catch (error) {
      console.error('Error fetching currencies:', error);
      throw error;
    }
  }

  static async getCurrencyById(id: number) {
    try {
      const currency = await Currency.findByPk(id);
      return currency;
    } catch (error) {
      console.error('Error fetching currency:', error);
      throw error;
    }
  }

  static async createCurrency(currencyData: any) {
    try {
      const currency = await Currency.create(currencyData);
      return currency;
    } catch (error) {
      console.error('Error creating currency:', error);
      throw error;
    }
  }

  static async updateCurrency(id: number, currencyData: any) {
    try {
      const currency = await Currency.findByPk(id);
      if (currency) {
        await currency.update(currencyData);
        return currency;
      }
      return null;
    } catch (error) {
      console.error('Error updating currency:', error);
      throw error;
    }
  }

  static async deleteCurrency(id: number) {
    try {
      const currency = await Currency.findByPk(id);
      if (currency) {
        await currency.destroy();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error deleting currency:', error);
      throw error;
    }
  }

  // Role operations
  static async getAllRoles() {
    try {
      const roles = await Role.findAll({
        order: [['id', 'DESC']]
      });
      return roles;
    } catch (error) {
      console.error('Error fetching roles:', error);
      throw error;
    }
  }

  static async getRoleById(id: number) {
    try {
      const role = await Role.findByPk(id);
      return role;
    } catch (error) {
      console.error('Error fetching role:', error);
      throw error;
    }
  }

  static async createRole(roleData: any) {
    try {
      const role = await Role.create(roleData);
      return role;
    } catch (error) {
      console.error('Error creating role:', error);
      throw error;
    }
  }

  static async updateRole(id: number, roleData: any) {
    try {
      const role = await Role.findByPk(id);
      if (role) {
        await role.update(roleData);
        return role;
      }
      return null;
    } catch (error) {
      console.error('Error updating role:', error);
      throw error;
    }
  }

  static async deleteRole(id: number) {
    try {
      const role = await Role.findByPk(id);
      if (role) {
        await role.destroy();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error deleting role:', error);
      throw error;
    }
  }

  // Market Source operations
  static async getAllMarketSources() {
    try {
      const marketSources = await MarketSource.findAll({
        order: [['id', 'DESC']]
      });
      return marketSources;
    } catch (error) {
      console.error('Error fetching market sources:', error);
      throw error;
    }
  }

  static async getMarketSourceById(id: number) {
    try {
      const marketSource = await MarketSource.findByPk(id);
      return marketSource;
    } catch (error) {
      console.error('Error fetching market source:', error);
      throw error;
    }
  }

  static async createMarketSource(marketSourceData: any) {
    try {
      const marketSource = await MarketSource.create(marketSourceData);
      return marketSource;
    } catch (error) {
      console.error('Error creating market source:', error);
      throw error;
    }
  }

  static async updateMarketSource(id: number, marketSourceData: any) {
    try {
      const marketSource = await MarketSource.findByPk(id);
      if (marketSource) {
        await marketSource.update(marketSourceData);
        return marketSource;
      }
      return null;
    } catch (error) {
      console.error('Error updating market source:', error);
      throw error;
    }
  }

  static async deleteMarketSource(id: number) {
    try {
      const marketSource = await MarketSource.findByPk(id);
      if (marketSource) {
        await marketSource.destroy();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error deleting market source:', error);
      throw error;
    }
  }

  // Branch operations
  static async getAllBranches() {
    try {
      const branches = await Branch.findAll({
        include: [
          { association: 'regionInfo', attributes: ['id', 'name'] }
        ],
        order: [['id', 'DESC']]
      });
      return branches;
    } catch (error) {
      console.error('Error fetching branches:', error);
      throw error;
    }
  }

  static async getBranchById(id: number) {
    try {
      const branch = await Branch.findByPk(id, {
        include: [
          { association: 'regionInfo' }
        ]
      });
      return branch;
    } catch (error) {
      console.error('Error fetching branch:', error);
      throw error;
    }
  }

  static async createBranch(branchData: any) {
    try {
      const branch = await Branch.create(branchData);
      return branch;
    } catch (error) {
      console.error('Error creating branch:', error);
      throw error;
    }
  }

  static async updateBranch(id: number, branchData: any) {
    try {
      const branch = await Branch.findByPk(id);
      if (branch) {
        await branch.update(branchData);
        return branch;
      }
      return null;
    } catch (error) {
      console.error('Error updating branch:', error);
      throw error;
    }
  }

  static async deleteBranch(id: number) {
    try {
      const branch = await Branch.findByPk(id);
      if (branch) {
        await branch.destroy();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error deleting branch:', error);
      throw error;
    }
  }

  // Region operations
  static async getAllRegions() {
    try {
      const regions = await Region.findAll({
        order: [['id', 'DESC']]
      });
      return regions;
    } catch (error) {
      console.error('Error fetching regions:', error);
      throw error;
    }
  }

  static async getRegionById(id: number) {
    try {
      const region = await Region.findByPk(id);
      return region;
    } catch (error) {
      console.error('Error fetching region:', error);
      throw error;
    }
  }

  static async createRegion(regionData: any) {
    try {
      const region = await Region.create(regionData);
      return region;
    } catch (error) {
      console.error('Error creating region:', error);
      throw error;
    }
  }

  static async updateRegion(id: number, regionData: any) {
    try {
      const region = await Region.findByPk(id);
      if (region) {
        await region.update(regionData);
        return region;
      }
      return null;
    } catch (error) {
      console.error('Error updating region:', error);
      throw error;
    }
  }

  static async deleteRegion(id: number) {
    try {
      const region = await Region.findByPk(id);
      if (region) {
        await region.destroy();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error deleting region:', error);
      throw error;
    }
  }
}

export { DatabaseService };
