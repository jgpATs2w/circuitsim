CSimElement = function(menuName, x, y){
	this.type = menuName.charAt(0);
	name = this.type+CSimElemDef[this.type]['counter'];
	this.name = name;
	this.node1 = null;
	this.node2 = null;
	this.value = CSimElemDef[this.type]['defValue'];
	this.v = null;
	this.r = null;
	this.i = null;
	
	CSimElemDef[this.type]['counter'] ++;
	CSimElements[this.name] = this;
	
	imageObj = new Image();
	imageObj.onload = function() {
	  image = new Kinetic.Image({
	    x: x,
	    y: y,
	    image: imageObj,
	    width: 60,
	    height: 60,
	    draggable: true
	  });
	  
	  image.setAttr('elemName', name);
	  
	  image.on('dblclick', function(e){ CSimEditor.show(this); });
	  
	  layer.add(image);
	  
	  stage.add(layer);
	};
	imageObj.src = "img/"+this.type+".png";
	
}

CSimEditor = {
	elem: null,
	input: document.getElementById('value'),
	label: document.getElementById('label'),
	init: function(){
		document.getElementById('save').addEventListener('click', CSimEditor.save );
	  	document.getElementById('cancel').addEventListener('click', CSimEditor.hide );
	},
	save: function(){
		CSimEditor.elem.value = CSimEditor.input.value;
		CSimEditor.hide();
	},
	cancel: function(){
		CSimEditor.hide();
	},
	show : function(image){
		$('#editor').dialog({modal: true});
		
		CSimEditor.elem = CSimElements[image.getAttr('elemName')];
		CSimEditor.label.innerHTML = CSimElemDef[this.elem.type]['label']+ '('+CSimElemDef[this.elem.type]['unit']+')'
		CSimEditor.input.value = CSimEditor.elem.value;
	},
	hide : function(){
		$('#editor').dialog('close');
	}
}
