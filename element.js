Element = function(name){
	this.name = name;
	this.node1 = null;
	this.node2 = null;
	this.value = null;
}
Element.prototype.edit = function(){
	console.info("value = "+this.value);
}
