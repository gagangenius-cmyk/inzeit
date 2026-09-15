import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../lib/sequelize';
interface CrmOfficialEmailsAttributes {
  id: number;
  branch: number;
  frontend: string;
  backend: string;
  status: number;
  created: Date;
}

interface CrmOfficialEmailsCreationAttributes extends Optional<CrmOfficialEmailsAttributes, never> {}

class CrmOfficialEmails extends Model<CrmOfficialEmailsAttributes, CrmOfficialEmailsCreationAttributes> implements CrmOfficialEmailsAttributes {
  declare id: number;
  declare branch: number;
  declare frontend: string;
  declare backend: string;
  declare status: number;
  declare created: Date;

  public static associate(models: any) {
  }
}

CrmOfficialEmails.init(
  {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    branch: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    frontend: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    backend: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    status: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    created: {
      type: DataTypes.DATE,
      allowNull: false
    },
  },
  {
    sequelize,
    modelName: 'CrmOfficialEmails',
    tableName: 'crm_official_emails',
    timestamps: false,
    freezeTableName: true,
  });

export { CrmOfficialEmails };
export type { CrmOfficialEmailsAttributes, CrmOfficialEmailsCreationAttributes };
