import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../lib/sequelize';

// See src/lib/mfa.ts, which is the actual read/write path for this table
// (raw SQL, matching this codebase's dominant data-access style) - this
// model exists for discoverability/associations/admin tooling, not as the
// primary way the app touches crm_employee_mfa.
interface CrmEmployeeMfaAttributes {
  employee_id: number;
  secret_encrypted: string;
  enabled: number;
  backup_codes_hashed: string | null;
  confirmed_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

interface CrmEmployeeMfaCreationAttributes extends Optional<CrmEmployeeMfaAttributes,
  'enabled' | 'backup_codes_hashed' | 'confirmed_at' | 'created_at' | 'updated_at'
> {}

class CrmEmployeeMfa extends Model<CrmEmployeeMfaAttributes, CrmEmployeeMfaCreationAttributes> implements CrmEmployeeMfaAttributes {
  declare employee_id: number;
  declare secret_encrypted: string;
  declare enabled: number;
  declare backup_codes_hashed: string | null;
  declare confirmed_at: Date | null;
  declare created_at: Date;
  declare updated_at: Date;

  public static associate(models: any) {
    CrmEmployeeMfa.belongsTo(models.CrmEmployee, { foreignKey: 'employee_id', targetKey: 'id', as: 'employee' });
  }
}

CrmEmployeeMfa.init(
  {
    employee_id: { type: DataTypes.INTEGER, allowNull: false, primaryKey: true },
    secret_encrypted: { type: DataTypes.TEXT, allowNull: false },
    enabled: { type: DataTypes.TINYINT, allowNull: false, defaultValue: 0 },
    backup_codes_hashed: { type: DataTypes.TEXT, allowNull: true },
    confirmed_at: { type: DataTypes.DATE, allowNull: true },
    created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  },
  {
    sequelize,
    modelName: 'CrmEmployeeMfa',
    tableName: 'crm_employee_mfa',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    freezeTableName: true,
  }
);

export { CrmEmployeeMfa };
export type { CrmEmployeeMfaAttributes, CrmEmployeeMfaCreationAttributes };
