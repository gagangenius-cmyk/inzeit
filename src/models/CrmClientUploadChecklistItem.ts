import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../lib/sequelize';

interface CrmClientUploadChecklistItemAttributes {
  id: number;
  portalId: number;
  itemName: string;
  required: boolean;
  status: 'pending' | 'uploaded' | 'verified' | 'rejected';
  fileUrl: string | null;
  uploadedAt: Date | null;
  verifiedBy: number | null;
  verifiedAt: Date | null;
  notes: string | null;
}

interface CrmClientUploadChecklistItemCreationAttributes extends Optional<CrmClientUploadChecklistItemAttributes, 'id' | 'fileUrl' | 'uploadedAt' | 'verifiedBy' | 'verifiedAt' | 'notes'> {}

class CrmClientUploadChecklistItem extends Model<CrmClientUploadChecklistItemAttributes, CrmClientUploadChecklistItemCreationAttributes> implements CrmClientUploadChecklistItemAttributes {
  declare id: number;
  declare portalId: number;
  declare itemName: string;
  declare required: boolean;
  declare status: 'pending' | 'uploaded' | 'verified' | 'rejected';
  declare fileUrl: string | null;
  declare uploadedAt: Date | null;
  declare verifiedBy: number | null;
  declare verifiedAt: Date | null;
  declare notes: string | null;

  public static associate(models: any) {
    CrmClientUploadChecklistItem.belongsTo(models.CrmClientUploadPortal, { foreignKey: 'portalId', targetKey: 'id', as: 'portal' });
  }
}

CrmClientUploadChecklistItem.init(
  {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    portalId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'crm_client_upload_portals',
        key: 'id'
      }
    },
    itemName: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    required: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    status: {
      type: DataTypes.ENUM('pending', 'uploaded', 'verified', 'rejected'),
      allowNull: false,
      defaultValue: 'pending'
    },
    fileUrl: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    uploadedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    verifiedBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'crm_employee',
        key: 'id'
      }
    },
    verifiedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  },
  {
    sequelize,
    modelName: 'CrmClientUploadChecklistItem',
    tableName: 'crm_client_upload_checklist_items',
    timestamps: false,
    freezeTableName: true,
  }
);

export { CrmClientUploadChecklistItem };
export type { CrmClientUploadChecklistItemAttributes, CrmClientUploadChecklistItemCreationAttributes };
