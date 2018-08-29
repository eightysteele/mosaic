function isPointerExport(node) {
  return node.type && node.type === "pointerExport";
}

export function closestPointerExportAncestor(node: any, document: any) {
  let curNode = node;
  while (
    !(isPointerExport(curNode))
    &&
    document.getParent(curNode.key)
  ) {
    curNode = document.getParent(curNode.key);
  }

  if (isPointerExport(curNode)) {
    return curNode;
  }
  return undefined;
}
