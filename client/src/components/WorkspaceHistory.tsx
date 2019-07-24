import gql from "graphql-tag";
import * as React from "react";
import { graphql } from "react-apollo";
import { compose } from "recompose";
import styled from "styled-components";

import { Assignment } from "./Assignment";

import { blockBorderAndBoxShadow } from "../styles";

const AssignmentContainer = styled.div`
  ${blockBorderAndBoxShadow};
  background-color: #f8f8f8;
  margin-bottom: 25px;
  width: 980px;
`;

export class WorkspaceHistoryPresentational extends React.PureComponent<
  any,
  any
> {
  public render() {
    if (this.props.workspaceHistoryQuery.workspace) {
      return (
        <div
          style={{
            alignItems: "center",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {this.props.workspaceHistoryQuery.workspace.assignments.map(
            (assignment, i) => (
              <AssignmentContainer key={i}>
                <Assignment assignmentId={assignment.id} />
              </AssignmentContainer>
            ),
          )}
        </div>
      );
    } else {
      return <div>Loading...</div>;
    }
  }
}

const WORKSPACE_HISTORY = gql`
  query workspaceHistoryQuery($id: String) {
    workspace(id: $id) {
      id
      assignments {
        id
      }
    }
  }
`;

export const WorkspaceHistory: any = compose(
  graphql(WORKSPACE_HISTORY, {
    name: "workspaceHistoryQuery",
    options: (props: any) => ({
      variables: {
        id: props.workspaceId,
      },
    }),
  }),
)(WorkspaceHistoryPresentational);