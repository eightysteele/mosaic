import * as Sequelize from "sequelize";
import {
  eventRelationshipColumns,
  eventHooks,
  addEventAssociations
} from "../eventIntegration";
import { getAllInlinesAsArray } from "../utils/slateUtils";
import { Value } from "slate";
import * as _ from "lodash";

const BlockModel = (
  sequelize: Sequelize.Sequelize,
  DataTypes: Sequelize.DataTypes
) => {
  const Block = sequelize.define(
    "Block",
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false
      },
      ...eventRelationshipColumns(DataTypes),
      type: {
        type: DataTypes.ENUM("QUESTION", "ANSWER", "SCRATCHPAD"),
        allowNull: false
      },
      value: {
        type: DataTypes.JSON
      },
      cachedExportPointerValues: {
        type: DataTypes.JSON
      }
    },
    {
      hooks: {
        beforeValidate: async (item: any, options: any) => {
          eventHooks.beforeValidate(item, options);
          item.cachedExportPointerValues = await item.exportingPointerValues();
        },
        beforeUpdate: (item: any, options: any) => {
          options.fields = item.changed();
        },
        afterSave: async (item: any, options: any) => {
          await item.ensureAllPointersAreInDatabase({ event: options.event });
        }
      }
    }
  );

  Block.associate = function(models: any) {
    Block.Workspace = Block.belongsTo(models.Workspace, {
      foreignKey: "workspaceId"
    });
    Block.ExportingPointers = Block.hasMany(models.Pointer, {
      as: "exportingPointers",
      foreignKey: "sourceBlockId"
    });
    addEventAssociations(Block, models);
  };

  Block.prototype.ensureAllPointersAreInDatabase = async function({ event }) {
    const exportingPointers = await this.getExportingPointers();
    const { cachedExportPointerValues } = this;

    for (const pointerId of Object.keys(cachedExportPointerValues)) {
      if (!_.includes(exportingPointers.map(p => p.id), pointerId)) {
        await this.createExportingPointer({ id: pointerId }, { event });
      }
    }
  };

  Block.prototype.connectedPointers = async function() {
    const pointers = await this.topLevelPointers();

    let allPointers = [...pointers];
    for (const pointer of pointers) {
      const subPointers = await pointer.containedPointers();
      allPointers = [...allPointers, ...subPointers];
    }
    return _.uniqBy(allPointers, "id");
  };

  Block.prototype.newConnectedPointers = async function(pointersSoFar) {
    const pointers = await this.newTopLevelPointers(pointersSoFar);

    let allPointers = [...pointers];

    for (const pointer of pointers) {
      const subPointers = await pointer.newContainedPointers([...allPointers, ...pointersSoFar]);
      allPointers = [...allPointers, ...subPointers];
    }
    return _.uniqBy(allPointers, "id");
  };

  // private
  Block.prototype.topLevelPointers = async function() {
    const topLevelPointerIds = await this.topLevelPointersIds();
    const pointers: any = [];
    for (const id of topLevelPointerIds) {
      const pointer = await sequelize.models.Pointer.findById(id);
      if (!!pointer) {
        pointers.push(pointer);
      } else {
        console.error(
          `Referenced pointer with ID ${id} not found in database.`
        );
      }
    }
    return _.uniqBy(pointers, "id");
  };

  Block.prototype.newTopLevelPointers = async function(pointersSoFar) {
    const topLevelPointerIds = await this.topLevelPointersIds();
    const newTopLevelPointerIds = topLevelPointerIds.filter(pointerId => {
      const alreadyListed = _.some(pointersSoFar, pointerSoFar => pointerSoFar.id === pointerId);
      return !alreadyListed;
    });

    const pointers: any = [];
    for (const id of newTopLevelPointerIds) {
      const pointer = await sequelize.models.Pointer.findById(id);
      if (!!pointer) {
        pointers.push(pointer);
      } else {
        console.error(
          `Referenced pointer with ID ${id} not found in database.`
        );
      }
    }
    return _.uniqBy(pointers, "id");
  };

  // private
  Block.prototype.topLevelPointersIds = async function() {
    if (!this.dataValues.value) {
      return [];
    }
    const _getInlinesAsArray = getAllInlinesAsArray(this.dataValues.value);
    const pointers = _getInlinesAsArray.filter(
      l => l.type === "pointerImport" || l.type === "pointerExport"
    );
    return pointers.map(p => p.data.pointerId);
  };

  // private
  Block.prototype.exportingPointerValues = async function() {
    if (!this.dataValues.value) {
      return {};
    }

    const _getInlinesAsArray = getAllInlinesAsArray(this.dataValues.value);
    const pointers = _getInlinesAsArray.filter(l => l.type === "pointerExport");

    const results = {};
    for (const pointer of pointers) {
      results[pointer.data.pointerId] = pointer;
    }
    return results;
  };

  return Block;
};

export default BlockModel;
