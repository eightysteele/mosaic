'use strict';
const Sequelize = require('sequelize')
var _ = require('lodash');
import {eventRelationshipColumns, eventHooks, addEventAssociations} from '../eventIntegration';

const WorkspaceModel = (sequelize, DataTypes) => {
  var Workspace = sequelize.define('Workspace', {
    id: {
      type: DataTypes.UUID(),
      primaryKey: true,
      defaultValue: Sequelize.UUIDV4,
      allowNull: false,
    },
    ...eventRelationshipColumns(DataTypes),
    childWorkspaceOrder: {
      type: DataTypes.ARRAY(DataTypes.TEXT),
      defaultValue: []
    },
    hasBeenDeletedByAncestor: {
      type: DataTypes.BOOLEAN(),
      defaultValue: false,
      allowNull: false
    },
  }, {
      hooks: {
        ...eventHooks.beforeValidate,
        afterCreate: async (workspace, {event, questionValue}) => {
          const blocks = await workspace.getBlocks();
          if (questionValue) {
            await workspace.createBlock({type: "QUESTION", value: questionValue}, {event})
          } else {
            await workspace.createBlock({type: "QUESTION"}, {event})
          }
          await workspace.createBlock({type: "SCRATCHPAD"}, {event})
          await workspace.createBlock({type: "ANSWER"}, {event})
        },
      }
    });
  Workspace.associate = function (models) {
    Workspace.ChildWorkspaces = Workspace.hasMany(models.Workspace, { as: 'childWorkspaces', foreignKey: 'parentId' })
    Workspace.PointerImports = Workspace.hasMany(models.PointerImport, { as: 'pointerImports', foreignKey: 'workspaceId' })
    Workspace.ParentWorkspace = Workspace.belongsTo(models.Workspace, { as: 'parentWorkspace', foreignKey: 'parentId' })
    Workspace.Blocks = Workspace.hasMany(models.Block, { as: 'blocks', foreignKey: 'workspaceId' })
    addEventAssociations(Workspace, models)
  }

  Workspace.createAsChild = async function ({parentId, question}, {event}) {
    const _workspace = await sequelize.models.Workspace.create({parentId}, {event, questionValue:question})
    return _workspace
  }

  Workspace.prototype.workSpaceOrderAppend = function (element) {
    return [...this.childWorkspaceOrder, element]
  }

  Workspace.prototype.updatePointerImports = async function (pointerIds, {event}) {
    const pointerImports = await this.getPointerImports()
    for (const pointerId of _.uniq(pointerIds)){
      if (!_.includes(pointerImports.map(p => p.pointerId), pointerId)){
        const pointer = await sequelize.models.Pointer.findById(pointerId);
        if (!pointer) {
          console.error ("The relevant pointer for pointer import ", pointerId, " does not exist.")
        } else {
          await this.createPointerImport({pointerId}, {event})
        }
      }
    }
  }

  Workspace.prototype.createChild = async function ({event, question}) {
    const child = await sequelize.models.Workspace.createAsChild({parentId: this.id, question}, {event})
    await this.update({
      childWorkspaceOrder: this.workSpaceOrderAppend(child.id),
    }, {event})
    return child
  }

  return Workspace;
};

export default WorkspaceModel;