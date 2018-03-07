import React = require("react");
import ReactDOM = require("react-dom");
import styled from "styled-components";
import { Button } from "react-bootstrap";

const HoverMenu = styled.span`
  background-color: #def4f757;
  color: black;
  padding: 3px 8px;
  border-radius: 2px;
  border: 1px solid #88d3eb;
`;

export class ImportMenu extends React.Component<any, any> {
  public render() {
    const {blockEditor: {hoveredItem: {id}, pointerReferences}, onChangePointerReference} = this.props;
    const reference = pointerReferences[id];
    const isOpen = reference && reference.isOpen;
    return (
      <div>
        {isOpen &&
          <Button bsSize={"small"} onClick={() => onChangePointerReference({id, reference: {isOpen: false}})} >
            Close 
          </Button>
        }
        {!isOpen &&
          <Button bsSize={"small"} onClick={() => onChangePointerReference({id, reference: {isOpen: true}})} >
            Expand
          </Button>
        }
          <Button bsSize={"small"}>
            Remove 
          </Button>
      </div>
    );
  }
}

export class ExportMenu extends React.Component<any, any> {
  public render() {
    const {blockEditor: {hoveredItem: {id}, pointerReferences}, onChangePointerReference} = this.props;
    return (
      <div>
        <Button bsSize={"small"} onClick={() => {}} >
            Remove Pointer 
        </Button>
      </div>
    );
  }
}

export class Menu extends React.Component<any> {
  public constructor(props: any) {
    super(props);
  }

  public render() {
    const root: any = window.document.getElementById("root");
    const {blockEditor} = this.props;
    return ReactDOM.createPortal(
      <div className="menu hover-menu" ref={this.props.menuRef}>
        <HoverMenu>
          {blockEditor && (blockEditor.hoveredItem.hoverItemType === "SELECTED_TEXT") &&
            <div>
              <Button bsSize={"small"} onClick={() => {}} >
                  Thing 
              </Button>
            </div>
          }
          {blockEditor && (blockEditor.hoveredItem.hoverItemType === "IMPORT") &&
            <ImportMenu
              blockEditor={this.props.blockEditor}
              onChangePointerReference={this.props.onChangePointerReference}
            />
          }
          {blockEditor && (blockEditor.hoveredItem.hoverItemType === "EXPORT") &&
            <ExportMenu
              blockEditor={this.props.blockEditor}
            />
          }
        </HoverMenu>
      </div>,
      root
    );
  }
}