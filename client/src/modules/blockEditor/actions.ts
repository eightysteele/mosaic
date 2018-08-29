import { UPDATE_BLOCK } from "../blocks/actions";
import * as slateChangeMutations from "../../slate-helpers/slate-change-mutations";

export const CHANGE_HOVERED_ITEM = "CHANGE_HOVERED_ITEM";
export const CHANGE_POINTER_REFERENCE = "CHANGE_POINTER_REFERENCE";

export const HOVER_ITEM_TYPES = {
  NONE: "NONE",
  SELECTED_TEXT: "SELECTED_TEXT",
  POINTER_IMPORT: "POINTER_IMPORT",
  POINTER_EXPORT: "POINTER_EXPORT"
};

export const changeHoverItem = ({
  id,
  hoverItemType,
  top,
  left,
  readOnly,
  blockId
}) => {
  return (dispatch, getState) => {
    dispatch({
      type: CHANGE_HOVERED_ITEM,
      id,
      hoverItemType,
      top,
      left,
      readOnly,
      blockId
    });
  };
};

export const removeHoverItem = () => {
  return (dispatch, getState) => {
    dispatch({
      type: CHANGE_HOVERED_ITEM,
      id: false,
      top: false,
      left: false,
      readOnly: null,
      blockId: false,
      hoverItemType: HOVER_ITEM_TYPES.NONE
    });
  };
};

export const changePointerReference = ({ id, reference }) => {
  return (dispatch, getState) => {
    dispatch({
      type: CHANGE_POINTER_REFERENCE,
      id,
      reference
    });
  };
};

export const exportSelection = () => {
  return async (dispatch, getState) => {
    const { blocks, blockEditor } = await getState();
    const { hoveredItem } = blockEditor;

    const block = blocks.blocks.find(b => b.id === hoveredItem.blockId);

    if (block) {
      const change = block.value.change();
      slateChangeMutations.insertPointerExport(change);
      slateChangeMutations.normalizeExportSpacing(change);
      
      dispatch({
        type: UPDATE_BLOCK,
        id: block.id,
        value: change.value,
        pointerChanged: true
      });
    } else {
      console.error("Block was not found from action");
    }
  };
};

function getInlinesAsArray(node: any) {
  let array: any = [];

  node.nodes.forEach(child => {
    if (child.object === "text") {
      return;
    }
    if (child.object === "inline") {
      array.push(child);
    }
    if (!child.isLeafInline()) {
      array = array.concat(getInlinesAsArray(child));
    }
  });

  return array;
}

export const removeExportOfSelection = () => {
  return async (dispatch, getState) => {
    const { blocks, blockEditor } = await getState();
    const { hoveredItem } = blockEditor;

    const block = blocks.blocks.find(b => b.id === hoveredItem.blockId);

    if (block) {
      const inlines = getInlinesAsArray(block.value.document);
      const matchingNodes = inlines.filter(
        i => i.toJSON().data.pointerId === hoveredItem.id
      );
      if (!matchingNodes.length) {
        console.error("Exporting node not found in Redux store");
        return;
      }

      const nodeToRemove = matchingNodes[0];

      let change;
      change = block.value.change();

      // remove pointerExport inline
      const ancestorNodes = block.value.document.getAncestors(nodeToRemove.key);
      const isNested = ancestorNodes.find(ancestor => ancestor.type === "pointerExport");

      if (isNested) {
        change
          .unwrapInlineByKey(nodeToRemove.key,  { data: { pointerId: hoveredItem.id } })
          .removeNodeByKey(nodeToRemove.key);
      } else {
        change.unwrapInlineByKey(nodeToRemove.key,  { data: { pointerId: hoveredItem.id } });
      }

      slateChangeMutations.normalizeAfterRemoval(change);

      dispatch({
        type: UPDATE_BLOCK,
        id: block.id,
        value: change.value
      });

      dispatch({
        type: CHANGE_HOVERED_ITEM,
        hoverItemType: "NONE"
      });
    } else {
      console.error("Block was not found from action");
    }
  };
};
