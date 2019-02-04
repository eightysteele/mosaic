import gql from "graphql-tag";
import * as _ from "lodash";
import * as React from "react";
import { graphql } from "react-apollo";
import { Button, Checkbox, OverlayTrigger, Popover } from "react-bootstrap";
import { compose } from "recompose";

export class ExperimentsCheckboxesPresentational extends React.Component<any,  any> {
  public state = {
    pending: false,
  }
  
  public handleOnChange = (event, experimentId, treeId) => {
    const isChecked = event.target.checked;

    this.setState({ pending: true }, async () => {
      if (isChecked) {
        await this.props.addTreeToExperimentMutation({
          variables: {
            experimentId,
            treeId,
          }
        });
      } else {
        await this.props.removeTreeFromExperimentMutation({
          variables: {
            experimentId,
            treeId,
          }
        });
      }
      this.setState({ pending: false });
    });
  };
  
  public render() {
    const experiments =  this.props.experimentsQuery.experiments && _.sortBy(
      this.props.experimentsQuery.experiments,
      experiment => Date.parse(experiment.createdAt)
    );

    const popoverWithProps = (
      this.props.experimentsQuery.loading
      ?
        <div />
      :
        (
          <Popover 
            id={`experiments-popover-${this.props.workspace.id}`}
            title="Experiments"
          >
            <div
              style={{
                opacity: this.state.pending ? 0.5 : 1,
              }}
            >
              {
                experiments.map(experiment => {
                  return (
                    <Checkbox
                      key={experiment.id}
                      checked={
                        this.props.workspace.tree.experiments.find(e => e.id === experiment.id)
                        ?
                        true
                        :
                        false
                      }
                      onChange={e => this.handleOnChange(e, experiment.id, this.props.workspace.tree.id)}
                    >
                      {experiment.name}
                    </Checkbox>
                  );
                })
              }
            </div>
          </Popover>
        )
    );

    const experimentsIncludedIn = 
      this.props.experimentsQuery.experiments
      &&
      this.props.experimentsQuery.experiments
       .filter(e1 => this.props.workspace.tree.experiments.find(e2 => e1.id === e2.id));
 
    return (
      <div
        style={{
          marginTop: "8px",
        }}
      >
        <OverlayTrigger trigger="click" placement="right" overlay={popoverWithProps}>
          <Button bsSize="xsmall" bsStyle="default">Edit Experiments</Button>
        </OverlayTrigger>
        <div style={{ marginTop: "5px"}}>
        Currently included in: {
          experimentsIncludedIn.length === 0
          ?
          "none"
          :
          <ul>
            {experimentsIncludedIn.map((e, i, arr) => <li key={`${this.props.workspace.id}${e.id}`}>{e.name}</li>)}
          </ul>
        }
        </div>
      </div>
    );
  }
}

const EXPERIMENTS_QUERY = gql`
  query experiments {
    experiments {
      id
      createdAt
      name
    }
  }
`; 

const ADD_TREE_TO_EXPERIMENT_MUTATION = gql`
  mutation addTreeToExperiment($experimentId: String, $treeId: String) {
    addTreeToExperiment(experimentId: $experimentId, treeId: $treeId)
  }
`; 

const REMOVE_TREE_FROM_EXPERIMENT_MUTATION = gql`
  mutation removeTreeFromExperiment($experimentId: String, $treeId: String) {
    removeTreeFromExperiment(experimentId: $experimentId, treeId: $treeId)
  }
`; 

export const ExperimentsCheckboxes: any = compose(
  graphql(EXPERIMENTS_QUERY, {
    name: "experimentsQuery",
  }),
  graphql(ADD_TREE_TO_EXPERIMENT_MUTATION, {
    name: "addTreeToExperimentMutation",
    options: {
      refetchQueries: ["RootWorkspacesQuery"]
    }
  }),
  graphql(REMOVE_TREE_FROM_EXPERIMENT_MUTATION, {
    name: "removeTreeFromExperimentMutation",
    options: {
      refetchQueries: ["RootWorkspacesQuery"]
    }
  })
)(ExperimentsCheckboxesPresentational);
