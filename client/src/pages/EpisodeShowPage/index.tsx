import * as React from "react";
import gql from "graphql-tag";
import { graphql } from "react-apollo";
import { compose } from "recompose";
import { Row, Col, Button } from "react-bootstrap";
import { connect } from "react-redux";

import { ChildrenSidebar } from "./ChildrenSidebar";
import { Link } from "react-router-dom";
import { addBlocks, saveBlocks } from "../../modules/blocks/actions";
import { BlockEditor } from "../../components/BlockEditor";
import { BlockHoverMenu } from "../../components/BlockHoverMenu";
import { PointerTable } from "./PointerTable";
import { exportingPointersSelector, exportingBlocksPointersSelector, exportingNodes } from "../../modules/blocks/exportingPointers";
import Plain from "slate-plain-serializer";
import _ = require("lodash");
import { Value } from "slate";
import * as uuidv1 from "uuid/v1";

const WORKSPACE_QUERY = gql`
    query workspace($id: String!){
        workspace(id: $id){
          id
          parentId
          childWorkspaceOrder
          pointerImports{
            id
            pointer {
                id
                value
            }
          }
          childWorkspaces{
            id
            pointerImports{
                id
                pointer {
                    id
                    value
                }
            }
            blocks{
              id
              value
              type
            }
          }
          blocks{
              id
              value
              type
          }
        }
    }
 `;

const UPDATE_BLOCKS = gql`
    mutation updateBlocks($blocks:[blockInput]){
        updateBlocks(blocks:$blocks){
            id
            value
            updatedAtEventId
        }
    }
`;

const UPDATE_WORKSPACE = gql`
    mutation updateWorkspace($id: String!, $childWorkspaceOrder: [String]){
        updateWorkspace(id: $id, childWorkspaceOrder: $childWorkspaceOrder){
            id
        }
    }
`;

const NEW_CHILD = gql`
  mutation createChildWorkspace($workspaceId:String, $question:JSON){
    createChildWorkspace(workspaceId:$workspaceId, question:$question ){
        id
    }
  }
`;

const ParentLink = (props) => (
    <Link to={`/workspaces/${props.parentId}`}>
        <Button>To Parent</Button>
    </Link>
);

function outputsToInputs(value: any) {
    const nodes = value.document.nodes[0].nodes; 
    const newNodes = nodes.map((n) => {
        if (n.type && n.type === "pointerExport") {
            return ({
            object: "inline",
            type: "pointerImport",
            isVoid: true,
            data: {
                pointerId: n.data.pointerId,
                internalReferenceId: uuidv1(),
            },
            });
        } else {
            return n;
        }
    });
    const newValue = _.cloneDeep(value);
    newValue.document.nodes[0].nodes = newNodes;
    return newValue;
}

function findPointers(value) {
    const _value = value ? Value.fromJSON(value) : Plain.deserialize("");
    const pointers = exportingNodes(_value.document);
    return pointers;
}

export class FormPagePresentational extends React.Component<any, any> {
    public constructor(props: any) {
        super(props);
        this.updateBlocks = this.updateBlocks.bind(this);
    }

    public componentDidMount() {
        console.log("MOUNT");
    }

    public updateBlocks(blocks: any) {
        const variables = { blocks };
        this.props.updateBlocks({
            variables,
        });
    }

    public render() {
        const workspace = this.props.workspace.workspace;
        if (!workspace) {
            return <div> Loading </div>;
        }
        const question = workspace.blocks.find((b) => b.type === "QUESTION");
        const answer = workspace.blocks.find((b) => b.type === "ANSWER");
        const scratchpad = workspace.blocks.find((b) => b.type === "SCRATCHPAD");

        const importingWorkspaces = [workspace, ...workspace.childWorkspaces];
        let importedPointers = _.flatten(importingWorkspaces.map((w) => w.pointerImports.map((p) => p.pointer.value).filter((v) => !!v)));
        const availablePointers = _.uniqBy([...this.props.exportingPointers, ...importedPointers, ...findPointers(question.value)], (p) => p.data.pointerId);
        return (
            <div key={workspace.id}>
                <BlockHoverMenu>
                    <Row>
                        <Col sm={12}>
                            {workspace.parentId &&
                                <ParentLink parentId={workspace.parentId} />
                            }
                            <h1>
                                <BlockEditor
                                    name={question.id}
                                    blockId={question.id}
                                    initialValue={question.value && outputsToInputs(question.value) || false}
                                    readOnly={true}
                                    canExport={false}
                                    availablePointers={availablePointers}
                                />
                            </h1>
                        </Col>
                    </Row>
                    <Row>
                        <Col sm={4}>
                            <h3>Scratchpad</h3>
                            <BlockEditor
                                name={question.id}
                                blockId={scratchpad.id}
                                initialValue={scratchpad.value}
                                availablePointers={availablePointers}
                                canExport={true}
                            />
                            <h3>Answer</h3>
                            <BlockEditor
                                name={answer.id}
                                blockId={answer.id}
                                initialValue={answer.value}
                                availablePointers={availablePointers}
                                canExport={false}
                            />
                            <Button onClick={() => { this.props.saveBlocks({ ids: [scratchpad.id, answer.id], updateBlocksFn: this.updateBlocks }); }}> Save </Button>
                        </Col>
                        <Col sm={2}>
                            <h3>Pointers</h3>
                            <PointerTable
                                availablePointers={availablePointers}
                            />
                        </Col>
                        <Col sm={6}>
                            <ChildrenSidebar
                                workspaces={workspace.childWorkspaces}
                                availablePointers={availablePointers}
                                workspaceOrder={workspace.childWorkspaceOrder}
                                onCreateChild={(question) => { this.props.createChild({ variables: { workspaceId: workspace.id, question } }); }}
                                changeOrder={(newOrder) => { this.props.updateWorkspace({ variables: { id: workspace.id, childWorkspaceOrder: newOrder } }); }}
                            />
                        </Col>
                    </Row>
                </BlockHoverMenu>
            </div>
        );
    }
}

const options: any = ({ match }) => ({
    variables: { id: match.params.workspaceId },
});

function visibleBlockIds(workspace: any) {
    if (!workspace) { return []; }
    const directBlockIds = workspace.blocks.map((b) => b.id);
    const childBlockIds = _.flatten(workspace.childWorkspaces.map((w) => w.blocks.filter((b) => b.type !== "SCRATCHPAD"))).map((b: any) => b.id);
    return [...directBlockIds, ...childBlockIds];
}

function mapStateToProps(state: any, { workspace }: any) {
    const _visibleBlockIds = visibleBlockIds(workspace.workspace);
    const exportingPointers = exportingBlocksPointersSelector(_visibleBlockIds)(state);
    const { blocks, blockEditor } = state;
    return { blocks, exportingPointers };
}

export const EpisodeShowPage = compose(
    graphql(WORKSPACE_QUERY, { name: "workspace", options }),
    graphql(UPDATE_BLOCKS, { name: "updateBlocks" }),
    graphql(UPDATE_WORKSPACE, {
        name: "updateWorkspace", options: {
            refetchQueries: [
                "workspace",
            ],
        },
    }),
    graphql(NEW_CHILD, {
        name: "createChild", options: {
            refetchQueries: [
                "workspace",
            ],
        },
    }),
    connect(
        mapStateToProps, { addBlocks, saveBlocks }
    )
)(FormPagePresentational);
