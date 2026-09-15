import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../lib/sequelize';
interface CrmLibraryAttributes {
  id: number;
  groups: number;
  file_name: string;
  files: string;
  file_type: number;
  file_of_folder: number;
  folder_id: number;
  status: number;
  created: Date;
  created_by: number;
}

interface CrmLibraryCreationAttributes extends Optional<CrmLibraryAttributes, never> {}

class CrmLibrary extends Model<CrmLibraryAttributes, CrmLibraryCreationAttributes> implements CrmLibraryAttributes {
  declare id: number;
  declare groups: number;
  declare file_name: string;
  declare files: string;
  declare file_type: number;
  declare file_of_folder: number;
  declare folder_id: number;
  declare status: number;
  declare created: Date;
  declare created_by: number;

  public static associate(models: any) {
  }
}

CrmLibrary.init(
  {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    groups: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    file_name: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    files: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    file_type: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    file_of_folder: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    folder_id: {
      type: DataTypes.INTEGER,
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
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
  },
  {
    sequelize,
    modelName: 'CrmLibrary',
    tableName: 'crm_library',
    timestamps: false,
    freezeTableName: true,
  });

export { CrmLibrary };
export type { CrmLibraryAttributes, CrmLibraryCreationAttributes };
