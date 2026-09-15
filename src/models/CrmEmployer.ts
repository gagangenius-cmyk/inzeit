import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../lib/sequelize';
interface CrmEmployerAttributes {
  id: number;
  name: string;
  email: string | null;
  mobile: string | null;
  paddress: string | null;
  vendor_id: number;
  status: number;
  website: string;
  company_name: string;
  created: Date;
  created_by: number;
}

interface CrmEmployerCreationAttributes extends Optional<CrmEmployerAttributes, 'email' | 'mobile' | 'paddress' | 'status'> {}

class CrmEmployer extends Model<CrmEmployerAttributes, CrmEmployerCreationAttributes> implements CrmEmployerAttributes {
  declare id: number;
  declare name: string;
  declare email: string | null;
  declare mobile: string | null;
  declare paddress: string | null;
  declare vendor_id: number;
  declare status: number;
  declare website: string;
  declare company_name: string;
  declare created: Date;
  declare created_by: number;

  public static associate(models: any) {
  }
}

CrmEmployer.init(
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
    mobile: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    paddress: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    vendor_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    status: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1
    },
    website: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    company_name: {
      type: DataTypes.STRING(200),
      allowNull: false
    },
    created: {
      type: DataTypes.DATE,
      allowNull: false
    },
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
  },
  {
    sequelize,
    modelName: 'CrmEmployer',
    tableName: 'crm_employer',
    timestamps: false,
    freezeTableName: true,
  });

export { CrmEmployer };
export type { CrmEmployerAttributes, CrmEmployerCreationAttributes };
