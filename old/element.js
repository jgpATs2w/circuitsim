CSimElement = function(menuName, x, y){
	this.type = menuName.charAt(0);
	this.name = this.type+CSim.elemDef[this.type]['counter'];;
	this.node1 = null;
	this.node2 = null;
	this.value = CSim.elemDef[this.type]['defValue'];
	this.v = null;
	this.r = null;
	this.i = null;
	this.x = x;
	this.y = y;
	
	CSim.elemDef[this.type]['counter'] ++;
	CSim.elements[this.name] = this;
	
	CSimCanvas._addElement(this);
}
CSimElement.prototype._loadImage = function(x,y){
		image = new Kinetic.Image({
			x: x,
			y: y,
			image: imageObj,
			width: CSim._elemsize,
			height: CSim._elemsize,
			offset: [CSim._elemsize/2, CSim._elemsize/2],
			stroke:"#9966FF",
			strokeWidth:2,
			draggable: true
		});
		this.image = image;
		image.setAttr('elemName', elem.name);
		
		elem._addListeners();
		
		elem._addStyle();
		  
		CSimCanvas._addImage(image);
}
CSimElement.prototype._loadLabel = function(){
	if (x0==xf){
		tx = x0 - 35;
		ty = (y0 + yf)/2;
	} else {
		tx = (x0 + xf)/2;
		ty = y0 - 30;
	}
	
	var text = new Kinetic.Text({
		x: tx-12,
		y: ty-12,
		text:  name,
		fontSize: 22,//TODO ajustar a tamaño pantalla
		fontFamily: 'calibri',
		fill: '#000099',
		name: name,
		draggable: true
	});
	
	this._textlayer.add(text);
	this._textlayer.draw();
}
CSimElement.prototype._addStyle = function(){
	this.image.on("mouseover", function(){ document.body.style.cursor =  "pointer"; });
	this.image.on("mouseout", function() { document.body.style.cursor = "default"; });
}
CSimElement.prototype._addListeners = function(){
	this.image.on( 'dblclick' , this._dblclick );
	this.image.on( 'mouseup', this._dragend );
}
CSimElement.prototype._dblclick = function(){
	CSimEditor.show(this);
}
CSimElement.prototype._dragend = function(){
	x = this.getAttr("x");
	y = this.getAttr("y");
	
	var p = CSimCanvas._ajustaramalla(x,y);
	
	this.setAttr("x",p[0]);
	this.setAttr("y",p[1]);
	
	CSimCanvas._draglayer.draw();
	
	var elem = this.getAttr('elem');
		elem.x = p[0];
		elem.y = p[1];
	
	//determina la posición de los extremos del elemento en función de la posición de la imagen
	if (this.getAttr("rotation") % Math.PI == 0){
	
		x0 = p[0] - CSim._elemsize/2;
		xf = p[0] + CSim._elemsize/2;
		y0 = yf = y1 = y2 = p[1];
		
		x1 = x0 + CSim._malla;
		x2 = xf - CSim._malla;
		
	} else {
	
		x0 = xf = x1 = x2 = p[0];
		y0 = p[1] - CSim._elemsize/2;
		yf = p[1] + CSim._elemsize/2;
		
		y1 = y0 + CSim._malla;
		y2 = yf - CSim._malla;
	}
	
	CSim._addtomatrix(x1, y1, x2, y2, elem.type);

	//añade una 'unidad' de cable en cada extremo
	CSim._addtomatrix(x0, y0, x1, y1, "w"); 
	CSim._addtomatrix(x2, y2, xf, yf, "w");
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
		
		CSimEditor.elem = image.getAttr('elem');
		CSimEditor.label.innerHTML = CSim.elemDef[CSimEditor.elem.type]['label']+ '('+CSim.elemDef[CSimEditor.elem.type]['unit']+')'
		CSimEditor.input.value = CSimEditor.elem.value;
	},
	hide : function(){
		$('#editor').dialog('close');
	}
}
CSimDragop = {
	allowDrop : function(e){
		e.preventDefault();
	},
	drag : function(e){
		e.dataTransfer.setData("text", e.target.id);
	},
	drop : function(e){
		e.preventDefault();
	  	var id = e.dataTransfer.getData("text");
	  	if(id.indexOf('menu') <= 0) return true;
	  	var pos = CSimCanvas._getcoordinates(e);
	  	elem = new CSimElement(id, pos[0], pos[1]);
	}
}
CSimCanvas = {
	_wiring: false,
	_drawing : false,
	_load : function(){
		this.anchura = Math.min(1100,$(window).width())-300;
		this.altura = Math.min(500,$(window).height())-50;
		
		//TODO: incluir elemento contenedor si no existe
		this.contenedor=document.getElementById("contenedor");
		
		$("#contenedor").width(this.anchura);
		$("#contenedor").height(this.altura);
		
		$("#contenedor").offset({
			top: ($(window).height() - this.altura)/2, 
			left: ($(window).width() - this.anchura)/2 + 120
		});
		this._stage = new Kinetic.Stage({
			container: 'contenedor',
			width: this.anchura,
			height: this.altura
		});
		
		this._backgroundlayer = new Kinetic.Layer();
		this._circuitlayer = new Kinetic.Layer();
		this._panellayer = new Kinetic.Layer();
		this._draglayer = new Kinetic.Layer();
		this._textlayer = new Kinetic.Layer();
		this._nodeslayer = "";
		
		this._stage.add(this._backgroundlayer);
		this._stage.add(this._circuitlayer);
		this._stage.add(this._panellayer);
		this._stage.add(this._draglayer);
		this._stage.add(this._textlayer);
	},
	_dibujarMalla : function(){
		var fondo = new Kinetic.Rect({
			x: 0,
			y: 0,
			width: this.anchura,
			height: this.altura,
			fill: "white",
			stroke: "black",
			strokeWidth: 4
		});
		this._backgroundlayer.add(fondo);		 
		
		for (var i=CSim._malla; i<this.anchura; i+=CSim._malla){
			for (var j=CSim._malla; j<this.altura; j+=CSim._malla){	
				var rect = new Kinetic.Rect({
					x: i-1,
					y: j-1,
					width: 2,
					height: 2,
					fill: "darkgray",
				});
				
				this._backgroundlayer.add(rect);
			}
		}
		this._backgroundlayer.draw();
	},
	_initListeners : function(){
		this.contenedor.addEventListener('mousedown', this._mousedown, false);
		this.contenedor.addEventListener('mousemove', this._mousemove, false);
		this.contenedor.addEventListener('mouseup', this._mouseup, false);
	},
	_addElement : function(elem){
		imageObj = new Image();
		imageObj.name = elem.name;
		imageObj.onload = function(e) {
			var elem = CSim.elements[e.target.name];
			image = new Kinetic.Image({
				x: elem.x,
				y: elem.y,
				image: imageObj,
				width: CSim._elemsize,
				height: CSim._elemsize,
				offset: [CSim._elemsize/2, CSim._elemsize/2],
				stroke:"#9966FF",
				strokeWidth:2,
				draggable: true
			});
			elem.image = image;
			image.setAttr('elem', elem);
			
			elem._addListeners();
			
			elem._addStyle();
			  
			CSimCanvas._draglayer.add(image);
			  
			CSimCanvas._stage.add(CSimCanvas._draglayer);
		};
		imageObj.src = "img/"+elem.type+".png";
		
		
	},
	_getcoordinates : function (ev){
			return [ev.clientX - $("#contenedor").position().left,
					ev.clientY - $("#contenedor").position().top];
	},
	_ajustaramalla : function (x,y){
			return [Math.round(x/CSim._malla)*CSim._malla,
					Math.round(y/CSim._malla)*CSim._malla];
	},
	_mousedown : function (ev){
			
		if ( ! CSimCanvas._wiring ){return;}
		
		var p = CSimCanvas._getcoordinates(ev);	
		p = CSimCanvas._ajustaramalla(p[0],p[1]);
		var x = p[0]; var y = p[1];
		
		groundnode = {x: x*2/CSim._malla, y: y*2/CSim._malla};
		
		CSimCanvas._drawing = true;
		CSimCanvas._dir = "";
		
		CSimCanvas._x0 = x;
		CSimCanvas._y0 = y;
		CSimCanvas._x1 = x;
		CSimCanvas._y1 = y;
		
		CSimCanvas._drawinglayer = new Kinetic.Layer();
		
		CSimCanvas._templine = new Kinetic.Line({
			points: [CSimCanvas._x0, CSimCanvas._y0, CSimCanvas._x0, CSimCanvas._y0],
	        stroke: "black",
	        strokeWidth: CSim._cablewidth,
	        lineCap: 'round',
	        lineJoin: 'round'
	     });
		 
	    CSimCanvas._drawinglayer.add(CSimCanvas._templine); 
		CSimCanvas._stage.add(CSimCanvas._drawinglayer);
		
	},
	_mousemove : function (ev){
		if (CSimCanvas._drawing){
		
			var p = CSimCanvas._getcoordinates(ev);
			p = CSimCanvas._ajustaramalla(p[0], p[1]);
			var x = p[0]; var y = p[1];
			
			if (CSimCanvas._dir == "" && Math.abs(x-CSimCanvas._x0) + Math.abs(CSim._y-CSimCanvas._y0) > 3*CSim._malla){
				(Math.abs(x-CSimCanvas._x0)>2*CSim._malla) ? CSimCanvas._dir = "horizontal" : CSimCanvas._dir = "vertical";
			}
			
			// si la dirección ya está clara, la mantiene
			switch (CSim._dir){
				
				case "horizontal":
					CSimCanvas._x1 = x;
					CSimCanvas._y1 = CSimCanvas._y0;
					break;
					
				case "vertical":
					CSimCanvas._x1 = CSimCanvas._x0;
					CSimCanvas._y1 = y;
					break;
					
				default:
					if (Math.abs(x-CSimCanvas._x0) > Math.abs(y-CSimCanvas._y0)){
						CSimCanvas._x1 = x;
						CSimCanvas._y1 = CSimCanvas._y0;
					} else {
						CSimCanvas._x1 = CSimCanvas._x0;
						CSimCanvas._y1 = y;
					}
					break;
			}	
			
			
			CSimCanvas._x2 = x;
			CSimCanvas._y2 = y;
				
			CSimCanvas._templine.setAttr("points", [CSimCanvas._x0, CSimCanvas._y0,
													CSimCanvas._x1, CSimCanvas._y1,
													CSimCanvas._x2, CSimCanvas._y2]);
			
			CSimCanvas._drawinglayer.draw();
			
		}
	},
	_mouseup : function (ev){
		
			var p = CSimCanvas._getcoordinates(ev);
			p = CSimCanvas._ajustaramalla(p[0], p[1]);
			
			if (CSimCanvas._drawing){
			
				if (CSimCanvas._x0 != CSimCanvas._x1 || CSimCanvas._y0 != CSimCanvas._y1){
					
					CSimCanvas._circuitlayer.add(CSimCanvas._templine);
					CSimCanvas._circuitlayer.draw();
					
					CSim._addtomatrix(CSimCanvas._x0, CSimCanvas._y0, CSimCanvas._x1, CSimCanvas._y1, 'w');
					CSim._addtomatrix(CSimCanvas._x1, CSimCanvas._y1, CSimCanvas._x2, CSimCanvas._y2, 'w');
				}
		
				CSimCanvas._drawing = false;
				CSimCanvas._drawinglayer.remove();			
			}
	}
}
