import { Model, DataTypes, Optional, type ModelStatic } from 'sequelize';
import { sequelize } from '../lib/sequelize';
import { CrmcForumLeads } from './CrmcForumLeads';
interface CrmEmployeeAttributes {
  id: number;
  name: string;
  email: string | null;
  cemail: string | null;
  mobile: string | null;
  cmobile: string | null;
  paddress: string | null;
  address: string | null;
  photo: string | null;
  dob: Date | null;
  role: number | null;
  vendor_id: number;
  branch: number | null;
  region: number | null;
  username: string | null;
  password: string | null;
  status: number;
  ppNo: string | null;
  visaExp: Date | null;
  department: number | null;
  EID: string | null;
  doj: Date | null;
  nationality: string | null;
  dol: string | null;
  remark: string | null;
  labexp: string | null;
  bounce: number | null;
  em_local_name: string | null;
  em_home_name: string | null;
  em_local_number: string | null;
  em_home_number: string | null;
  religion: string;
  gender: string;
  crea: number;
  wfh: number;
  work_location: string;
  work_country: string | null;
  work_city: string | null;
  work_site: string | null;
  employment_type: string;
  manager_id: number | null;
  must_change_password: number;
}

type CrmEmployeeCreationAttributes = Optional<CrmEmployeeAttributes, 'email' | 'cemail' | 'mobile' | 'cmobile' | 'paddress' | 'address' | 'photo' | 'dob' | 'role' | 'branch' | 'region' | 'username' | 'password' | 'status' | 'ppNo' | 'visaExp' | 'department' | 'EID' | 'doj' | 'nationality' | 'dol' | 'remark' | 'labexp' | 'bounce' | 'em_local_name' | 'em_home_name' | 'em_local_number' | 'em_home_number' | 'work_location' | 'work_country' | 'work_city' | 'work_site' | 'employment_type' | 'manager_id' | 'must_change_password'>;

type AssociationModels = {
  CrmRole: ModelStatic<Model>;
  CrmcForumLeads: ModelStatic<Model>;
  StudentLeadsLogs: ModelStatic<Model>;
  CrmOperationAllocations: ModelStatic<Model>;
  CrmEmployee: ModelStatic<Model>;
};

class CrmEmployee extends Model<CrmEmployeeAttributes, CrmEmployeeCreationAttributes> implements CrmEmployeeAttributes {
  declare id: number;
  declare name: string;
  declare email: string | null;
  declare cemail: string | null;
  declare mobile: string | null;
  declare cmobile: string | null;
  declare paddress: string | null;
  declare address: string | null;
  declare photo: string | null;
  declare dob: Date | null;
  declare role: number | null;
  declare vendor_id: number;
  declare branch: number | null;
  declare region: number | null;
  declare username: string | null;
  declare password: string | null;
  declare status: number;
  declare ppNo: string | null;
  declare visaExp: Date | null;
  declare department: number | null;
  declare EID: string | null;
  declare doj: Date | null;
  declare nationality: string | null;
  declare dol: string | null;
  declare remark: string | null;
  declare labexp: string | null;
  declare bounce: number | null;
  declare em_local_name: string | null;
  declare em_home_name: string | null;
  declare em_local_number: string | null;
  declare em_home_number: string | null;
  declare religion: string;
  declare gender: string;
  declare crea: number;
  declare wfh: number;
  declare work_location: string;
  declare work_country: string | null;
  declare work_city: string | null;
  declare work_site: string | null;
  declare employment_type: string;
  declare manager_id: number | null;
  declare must_change_password: number;

  // Association properties
  declare dmcForumLeadssByASSIGNTo?: CrmcForumLeads[];
  declare dmcForumLeadssByCASEOFFICER?: CrmcForumLeads[];
  declare dmcForumLeadssByCoUNSILOR?: CrmcForumLeads[];
  declare studentLeadsLogss?: unknown[];

  public static associate(models: AssociationModels) {
    CrmEmployee.belongsTo(models.CrmRole, { foreignKey: 'role', targetKey: 'id', as: 'dmRole' });
    CrmEmployee.hasMany(models.CrmcForumLeads, { foreignKey: 'assignTo', sourceKey: 'id', as: 'dmcForumLeadssByASSIGNTo' });
    CrmEmployee.hasMany(models.CrmcForumLeads, { foreignKey: 'case_officer', sourceKey: 'id', as: 'dmcForumLeadssByCASEOFFICER' });
    CrmEmployee.hasMany(models.CrmcForumLeads, { foreignKey: 'Counsilor', sourceKey: 'id', as: 'dmcForumLeadssByCoUNSILOR' });
    CrmEmployee.hasMany(models.StudentLeadsLogs, { foreignKey: 'Counsilor', sourceKey: 'id', as: 'studentLeadsLogss' });
    CrmEmployee.hasMany(models.CrmOperationAllocations, { foreignKey: 'case_officer', sourceKey: 'id', as: 'operationAllocations' });
    CrmEmployee.belongsTo(models.CrmEmployee, { foreignKey: 'manager_id', targetKey: 'id', as: 'manager' });
  }
}

CrmEmployee.init(
  {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING(555),
      allowNull: false
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    cemail: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    mobile: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    cmobile: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    paddress: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    address: {
      type: DataTypes.STRING(555),
      allowNull: true
    },
    photo: {
      type: DataTypes.STRING(555),
      allowNull: true
    },
    dob: {
      type: DataTypes.DATE,
      allowNull: true
    },
    role: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    vendor_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    branch: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    region: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    username: {
      type: DataTypes.STRING(555),
      allowNull: true
    },
    password: {
      type: DataTypes.STRING(555),
      allowNull: true
    },
    status: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1
    },
    ppNo: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    visaExp: {
      type: DataTypes.DATE,
      allowNull: true
    },
    department: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    EID: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    doj: {
      type: DataTypes.DATE,
      allowNull: true
    },
    nationality: {
      type: DataTypes.STRING(555),
      allowNull: true
    },
    dol: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    remark: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    labexp: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    bounce: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    em_local_name: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    em_home_name: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    em_local_number: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    em_home_number: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    religion: {
      type: DataTypes.STRING(200),
      allowNull: false
    },
    gender: {
      type: DataTypes.STRING(200),
      allowNull: false
    },
    crea: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    wfh: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    work_location: {
      type: DataTypes.ENUM('Onshore', 'Offshore', 'Remote-UAE', 'GCC-Branch'),
      allowNull: false,
      defaultValue: 'Onshore'
    },
    work_country: {
      type: DataTypes.STRING(255),
      allowNull: true,
      defaultValue: 'UAE'
    },
    work_city: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    work_site: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    employment_type: {
      type: DataTypes.ENUM('Full-time', 'Contract', 'Freelance', 'Part-time'),
      allowNull: false,
      defaultValue: 'Full-time'
    },
    manager_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    must_change_password: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 0
    },
  },
  {
    sequelize,
    modelName: 'CrmEmployee',
    tableName: 'crm_employee',
    timestamps: false,
    freezeTableName: true,
  });

export { CrmEmployee };
export type { CrmEmployeeAttributes, CrmEmployeeCreationAttributes };
