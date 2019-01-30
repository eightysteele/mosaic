import * as Sequelize from "sequelize";
import {
  eventRelationshipColumns,
  eventHooks,
  addEventAssociations,
} from "../eventIntegration";

const ExperimentModel = (
  sequelize: Sequelize.Sequelize,
  DataTypes: Sequelize.DataTypes
) => {
  const Experiment = sequelize.define(
    "Experiment",
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
      },
      name: Sequelize.STRING,
      description: Sequelize.JSON,
      ...eventRelationshipColumns(DataTypes),
    },
  );

  Experiment.associate = function(models: any) {
    Experiment.Trees = Experiment.belongsToMany(models.Tree, {through: 'ExperimentTreeRelation'});
    addEventAssociations(Experiment, models);
  };

  return Experiment;
};

export default ExperimentModel;