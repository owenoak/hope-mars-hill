// ::
// :: extensions to NamedNodeMap
// ::

// add ElementList and array iteration methods to NamedNodeMap
extend(NamedNodeMap.prototype, ElementList.defaults);
ListLike.mixinTo(NamedNodeMap, {override:false});
