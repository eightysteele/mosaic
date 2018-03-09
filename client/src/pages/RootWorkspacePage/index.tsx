import gql from "graphql-tag";
import { compose } from "recompose";
import { graphql } from "react-apollo";
import React = require("react");
import { Link } from "react-router-dom";
import { Button, Col, Row } from "react-bootstrap";
import styled from "styled-components";
import Plain from "slate-plain-serializer";
import { Form } from "react-final-form";
import { Value } from "slate";
import { BlockEditor } from "../../components/BlockEditor";
import { BlockHoverMenu } from "../../components/BlockHoverMenu";
import { NewBlockForm } from "../../components/NewBlockForm";

const WorkspaceStyle = styled.div`
  border: 1px solid #ddd;
  padding: 3px;
  margin-bottom: 3px;
`;

const WORKSPACES_QUERY = gql`
    query OriginWorkspaces{
        workspaces(where:{parentId:null}){
          id
          parentId
          childWorkspaceOrder
          blocks{
              id
              value
              type
          }
        }
    }
 `;

const CREATE_ROOT_WORKSPACE = gql`
  mutation createWorkspace($question:JSON){
    createWorkspace(question:$question ){
        id
        parentId
        childWorkspaceOrder
        blocks{
            id
            value
            type
        }
    }
  }
`;

const ParentWorkspace = ({ workspace }) => {
    const question = workspace.blocks && workspace.blocks.find((b) => b.type === "QUESTION");
    const answer = workspace.blocks && workspace.blocks.find((b) => b.type === "ANSWER");
    return (
        <WorkspaceStyle>
            <Row>
            <Col sm={5}> 
            {question && question.value &&
                <BlockEditor
                    name={question.id}
                    blockId={question.id}
                    initialValue={question.value}
                    readOnly={true}
                />
            }
            </Col> 
            <Col sm={5}> 
            {answer && answer.value &&
                <BlockEditor
                    name={answer.id}
                    blockId={answer.id}
                    initialValue={answer.value}
                    readOnly={true}
                />
            }
            </Col> 
            <Col sm={2}> 
            <Link to={`/workspaces/${workspace.id}`}>
                <Button> Open </Button>
            </Link>
            </Col> 
            </Row>
        </WorkspaceStyle>
    );
};

class NewWorkspaceForm extends React.Component<any, any> {
    public render() {
        const onSubmit = async (values) => {
            this.props.onCreateWorkspace(JSON.stringify(values.new.toJSON()));
        };
        return (
            <div>
                <h3> New Root Workspace </h3>
                <NewBlockForm onMutate={this.props.onCreateWorkspace}/>
            </div>
        );
    }
}

export class RootWorkspacePagePresentational extends React.Component<any, any> {
    public render() {
        console.log(this.props);
        const workspaces = this.props.originWorkspaces.workspaces;
        return (
            <BlockHoverMenu>
                <h1> Root Workspaces </h1>
                {workspaces && workspaces.map((w) => (
                    <ParentWorkspace workspace={w} key={w.id} />
                ))}
                <NewWorkspaceForm
                    onCreateWorkspace={(question) => { this.props.createWorkspace({ variables: { question } }); }}
                />
            </BlockHoverMenu>
        );
    }
}

export const RootWorkspacePage = compose(
    graphql(WORKSPACES_QUERY, { name: "originWorkspaces" }),
    graphql(CREATE_ROOT_WORKSPACE, {
        name: "createWorkspace", options: {
            refetchQueries: [
                "OriginWorkspaces",
            ],
        },
    }),
 )(RootWorkspacePagePresentational);