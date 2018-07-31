import * as React from "react";
import { PointerExportMark } from "./PointerExportMark";
import { PointerImportNode } from "./PointerImportNode";

function SlatePointers(options: any = {}) {
  return {
    onSelect(event: any, change: any, editor: any) {
      const { value } = editor.props;
      if (value.isBlurred || value.isEmpty) {
        return;
      }

      const selection = window.getSelection();
      let range;
      try {
        range = selection.getRangeAt(0);
      } catch (e) {
        return;
      }
      const rect = range.getBoundingClientRect();

      if (rect.width === 0) {
        window.setTimeout(() => {
          options.onSelectNull();
        }, 10);
        return;
      }

      const { left, right, top, bottom } = rect;
      window.setTimeout(() => {
        options.onSelect({ left, right, top, bottom });
      }, 10);
    },

    shouldNodeComponentUpdate(a: object, b: object) {
      return true;
    },

    renderNode(props: any) {
      const { children, node } = props; // { attributes, isSelected }
      if (node.type === "pointerExport") {
        const nodeAsJson = node.toJSON();
        const pointer =
          options.availablePointers.find(
            p => p.data.pointerId === nodeAsJson.data.pointerId
          ) || {};
        return (
          <PointerExportMark
            blockEditor={options.blockEditor}
            nodeAsJson={nodeAsJson}
            availablePointers={options.availablePointers}
            onMouseOver={({ left, right, top, bottom }) => {
              options.onMouseOverPointerExport({
                left,
                right,
                top,
                bottom,
                readOnly: pointer.readOnly,
                id: nodeAsJson.data.pointerId
              });
            }}
            children={children}
          />
        );
      }
      if (node.type === "text") {
        return <div>{children}</div>;
      }
      if (node.type === "pointerImport") {
        return (
          <PointerImportNode
            nodeAsJson={node.toJSON()}
            blockEditor={options.blockEditor}
            availablePointers={options.availablePointers}
            onMouseOver={({ left, right, top, bottom, id }) => {
              options.onMouseOverPointerImport({
                left,
                right,
                top,
                bottom,
                id
              });
            }}
            isHoverable={true}
          />
        );
      } else {
        return;
      }
    }
  };
}

export { SlatePointers };
