import { POINTER_EDGE_SPACE } from "../../lib/slate-pointers/exportedPointerSpacer";
import { TextNode } from "../../components/BlockEditor/types";

export function hasSpacerAsLastChar(textNode: TextNode, document: any) {
  return textNode.text.charAt(textNode.text.length - 1) === POINTER_EDGE_SPACE;
}
