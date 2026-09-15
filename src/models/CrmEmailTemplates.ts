import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../lib/sequelize';
interface CrmEmailTemplatesAttributes {
  id: number;
  program: string;
  template: string;
  created: Date;
  status: number;
  ops: number;
  sales: number;
  created_by: number;
}

interface CrmEmailTemplatesCreationAttributes extends Optional<CrmEmailTemplatesAttributes, never> {}

class CrmEmailTemplates extends Model<CrmEmailTemplatesAttributes, CrmEmailTemplatesCreationAttributes> implements CrmEmailTemplatesAttributes {
  declare id: number;
  declare program: string;
  declare template: string;
  declare created: Date;
  declare status: number;
  declare ops: number;
  declare sales: number;
  declare created_by: number;

  public static associate(models: any) {
  }
}

CrmEmailTemplates.init(
  {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    program: {
      type: DataTypes.STRING(200),
      allowNull: false
    },
    template: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    created: {
      type: DataTypes.DATE,
      allowNull: false
    },
    status: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    ops: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    sales: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
  },
  {
    sequelize,
    modelName: 'CrmEmailTemplates',
    tableName: 'crm_email_templates',
    timestamps: false,
    freezeTableName: true,
  });

export { CrmEmailTemplates };
export type { CrmEmailTemplatesAttributes, CrmEmailTemplatesCreationAttributes };
