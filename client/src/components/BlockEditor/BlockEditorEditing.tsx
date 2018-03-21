import * as React from "react";
import styled from "styled-components";
import { DropdownButton, MenuItem } from "react-bootstrap";
import { Inline } from "slate";
import * as uuidv1 from "uuid/v1";
import { ShowExpandedPointer } from "../../lib/slate-pointers/ShowExpandedPointer";
import { Editor } from "slate-react";
import { compose, withProps, withState } from "recompose";
import gql from "graphql-tag";
import { graphql } from "react-apollo";
import { connect } from "react-redux";
import { updateBlock } from "../../modules/blocks/actions";
import { MenuBar } from "./MenuBar";
import { MutationStatus } from "./types";
import _ = require("lodash");

const BlockEditorStyle = styled.div`
    background: #f4f4f4;
    border-radius: 2px;
    border: 1px solid #d5d5d5;
    margin-bottom: 1em;
    padding: .3em;
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

const AUTOSAVE_EVERY_N_SECONDS = 3;

export class BlockEditorEditingPresentational extends React.Component<any, any> {

    private autoSaveInterval: any;

    public constructor(props: any) {
        super(props);
        this.onChange = this.onChange.bind(this);
        this.handleBlur = this.handleBlur.bind(this);
        this.beginAutosaveInterval = this.beginAutosaveInterval.bind(this);
        this.endAutosaveInterval = this.endAutosaveInterval.bind(this);
        this.saveToDatabase = this.saveToDatabase.bind(this);
        this.onAddPointerImport = this.onAddPointerImport.bind(this);
        this.considerSaveToDatabase = this.considerSaveToDatabase.bind(this);
        this.state = {hasChangedSinceDatabaseSave: false};
    }

    public componentWillUnmount() {
        this.endAutosaveInterval();
    }

    public componentDidUpdate(prevProps: any) {
        const oldDocument = prevProps.block.value.document;
        const newDocument = this.props.block.value.document;

        if (!oldDocument.equals(newDocument)) {
            this.onValueChange();
        }
    }

    public render() {
        return (
            <div>
                <BlockEditorStyle>
                    <MenuBar
                        onAddPointerImport={this.onAddPointerImport}
                        availablePointers={this.props.availablePointers}
                        mutationStatus={this.props.mutationStatus}
                        hasChangedSinceDatabaseSave={this.state.hasChangedSinceDatabaseSave}
                    />
                    <Editor
                        value={this.props.value}
                        onChange={(c) => this.onChange(c.value)}
                        plugins={this.props.plugins}
                        spellCheck={false}
                        onBlur={this.handleBlur}
                    />
                </BlockEditorStyle>
            </div>
        );
    }

    private onValueChange() {
        const changeFromOutsideComponent = this.props.block.pointerChanged;
        if (changeFromOutsideComponent) {
            this.saveToDatabase();
        } else {
            this.beginAutosaveInterval();

            if (!this.state.hasChangedSinceDatabaseSave) {
                this.setState({ hasChangedSinceDatabaseSave: true });
            }
        }
    }

    private onChange(value: any, pointerChanged: boolean = false) {
        this.props.updateBlock({ id: this.props.block.id, value, pointerChanged });
        if (this.props.onChange) {
            this.props.onChange(value);
        }
    }

    private onAddPointerImport(pointerId: string) {
        const ch = this.props.value.change()
            .insertInline(Inline.fromJSON({
                object: "inline",
                type: "pointerImport",
                isVoid: true,
                data: {
                    pointerId: pointerId,
                    internalReferenceId: uuidv1(),
                },
            }));
        this.onChange(ch.value, true);
    }

    private considerSaveToDatabase() {
        if (this.state.hasChangedSinceDatabaseSave) {
            this.saveToDatabase();
        }
    }

    private saveToDatabase() {
        this.props.mutation();
        this.setState({hasChangedSinceDatabaseSave: false});
    }

    private beginAutosaveInterval() {
        if (this.props.autoSave && !this.autoSaveInterval) {
            this.autoSaveInterval = setInterval(this.considerSaveToDatabase, AUTOSAVE_EVERY_N_SECONDS * 1000);
        }
    }

    private endAutosaveInterval() {
        if (this.props.autoSave) {
            clearInterval(this.autoSaveInterval);
            delete this.autoSaveInterval;
        }
    }

    private handleBlur() {
        if (this.props.autoSave) {
            this.considerSaveToDatabase();
            this.endAutosaveInterval();
        }
    }
}

export const BlockEditorEditing: any = compose(
    connect(
        () => ({}), { updateBlock }
    ),
    graphql(UPDATE_BLOCKS, { name: "saveBlocksToServer" }),
    withState("mutationStatus", "setMutationStatus", { status: MutationStatus.NotStarted }),
    withProps(({ saveBlocksToServer, block, setMutationStatus }) => {
        const mutation = () => {
            setMutationStatus({ status: MutationStatus.Loading });
            saveBlocksToServer({
                variables: { blocks: { id: block.id, value: block.value.toJSON() } },
            }).then(() => {
                setMutationStatus({ status: MutationStatus.Complete });
            }).catch((e) => {
                setMutationStatus({ status: MutationStatus.Error, error: e });
            });
        };

        return { mutation, status };
    })
)(BlockEditorEditingPresentational);