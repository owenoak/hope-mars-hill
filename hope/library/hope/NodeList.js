// ::
// :: extensions to NodeList
// ::

// add ElementList and array iteration methods to ElementList, NodeList, NamedNodeMap
extend(NodeList.prototype, ElementList.defaults);
ListLike.mixinTo(NodeList, {override:false});
