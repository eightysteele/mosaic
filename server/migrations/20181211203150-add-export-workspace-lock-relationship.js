'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const ID_TYPE = Sequelize.UUID;

    const ID = {
      allowNull: false,
      primaryKey: true,
      type: ID_TYPE
    };

    const referenceTo = target => ({
      type: ID_TYPE,
      references: {
        model: target,
        key: "id"
      }
    });

    const standardColumns = {
      id: ID,
      createdAt: {
        type: Sequelize.DATE
      },
      updatedAt: {
        type: Sequelize.DATE
      },
      createdAtEventId: {
        type: Sequelize.INTEGER,
        references: {
          model: "Events",
          key: "id"
        }
      },
      updatedAtEventId: {
        type: Sequelize.INTEGER,
        references: {
          model: "Events",
          key: "id"
        }
      }
    };

    await queryInterface.createTable("ExportWorkspaceLockRelations", {
      ...standardColumns,
      workspaceId: referenceTo("Workspaces"),
      pointerId: referenceTo("Pointers"),
      isLocked: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("ExportWorkspaceLockRelations");
  }
};
