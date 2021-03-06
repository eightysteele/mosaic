import * as React from "react";
import { NewBlockForm } from "../../components/NewBlockForm";

class NewRootWorkspaceForExperimentForm extends React.Component<any, any> {
  public render() {
    return (
      <div style={this.props.style}>
        <NewBlockForm
          hasTimeBudget={true}
          maxTotalBudget={100000}
          onMutate={this.onCreateWorkspace}
          shouldAutosave={false}
        />
      </div>
    );
  }

  private onCreateWorkspace = ({ question, totalBudget }) => {
    this.props.createWorkspace({
      variables: {
        question,
        totalBudget,
        experimentId: this.props.experimentId,
      },
    });
  };
}

export { NewRootWorkspaceForExperimentForm };
