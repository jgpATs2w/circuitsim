CSim = {
	elemDef : {
		R:{
			counter:0,
			unit:'ohms',
			symbol:'Ω',
			label:'resistencia',
			defValue: 10,
			iniRotation: 0
		},
		V:{
			counter:0,
			unit:'voltios',
			symbol:'V',
			label:'Fuente Tensión Ideal',
			defValue: 1.5,
			iniRotation: 0
		},
		C:{
			counter:0,
			unit:'faradios',
			symbol:'F',
			label:'Condensador',
			defValue: 2,
			iniRotation: 0
		},
		G:{
			counter:0,
			unit:'',
			symbol:'',
			label:'Nodo tierra',
			defValue: 0,
			iniRotation: Math.PI/2
		}
	},
	elements : [],
	load : function(){
		console.info('empezando..');
	
		CSimCanvas._load();
		
		this._initListeners();

		this._inicializar();

		this._inicialiazarmatrices();

		CSimCanvas._dibujarMalla();

	},//end load
	_initListeners : function(){
		CSimCanvas._initListeners();
		
		$('#Rmenu').draggable({ helper: 'clone'});
		$('#Vmenu').draggable({ helper: 'clone'});
		$('#Gmenu').draggable({ helper: 'clone'});
	  
		$('#contenedor').droppable({
			drop: CSimDragop.drop
		});
		
		document.getElementById('solve').addEventListener('click', CSim._solve );
	    
		window.addEventListener('mousedown', this._mousedown, true);
	    window.addEventListener('keydown', this._keywindow, false);
	    
	    window.onerror = function (msg, url, line){
			console.error(this,'error event not catched: '+msg+' en '+url+' linea '+line);
			CSim.onError();
			return true;
		}
	},
	_inicializar : function (){
		this._elementdrag = false;
		this._mostrandonodos = false; //test
		this._selectedimg = "";
		this._tipoelemento = "w";
		this._groundnode = "";
		this._labeloffset = [];
	
		this._malla = 12;
		this._elemsize = this._malla*6;
		this._cablewidth = 2;
		
		this._matrizcables = [];
		this._matrizcircuito = [];
		this._matriznodos = [];
	
		this._netlist = [];
		
		this._numelemarray = [];
		this._elemtypes = "RVC";
	
		this._numelemtotal = 0;
		this._numnodes = 0;
	
		this._xmin = 10000;
		this._ymin = 10000;
		this._xmax = 0;
		this._ymax = 0;
		
		this._solution = "";
		
		CSimEditor.init();
	},
	_inicialiazarmatrices : function (){
		for (var i=0; i<CSimCanvas.anchura*2/this._malla; i++){
			this._matrizcables[i] = [];
			this._matrizcircuito[i] = [];
			this._matriznodos[i] = [];
			for (var j=0; j<CSimCanvas.altura*2/this._malla; j++){	
				this._matrizcables[i][j] = ".";
				this._matrizcircuito[i][j] = ".";
				this._matriznodos[i][j] = ".";
			}
		}
	},
	_addtomatrix : function (x0, y0, xf, yf, tipo, matriz){
		for (var i=Math.min(x0,xf)*2/this._malla; i<=Math.max(x0,xf)*2/this._malla; i++){
			for (var j=Math.min(y0,yf)*2/this._malla; j<=Math.max(y0,yf)*2/this._malla; j++){
				matriz[i][j] = tipo;
			}
		}
		this._xmin = Math.min(this._xmin, x0, xf);
		this._ymin = Math.min(this._ymin, y0, yf);
		this._xmax = Math.max(this._xmax, x0, xf);
		this._ymax = Math.max(this._ymax, y0, yf);
	},
	_solve : function(){
		with(CSim){
			_addelementstomatrix();
			_encontrarnodos();
			_generarnetlist();
			if(_everythingfine){
				_mostrarmatriznodos();//test
				_solveMNA(CSim._netlist);
				_mostrarnodos();
				_showSolution();
			}else
				onError();
		}
		
	},
	onError : function(){
		throw new Error('no ha finalizado la solución');
	},
	_addelementstomatrix : function (){
	
		CSim._groundnode = "";
		
		for (var j=this._ymin*2/this._malla; j<=this._ymax*2/this._malla; j++){	
			for (var i=this._xmin*2/this._malla; i<=this._xmax*2/this._malla; i++){
				this._matrizcircuito[i][j] = this._matrizcables[i][j];
			}
		}
		
		for (var i in CSim.elements){
			var elem = CSim.elements[i];
			elem._getelemcoordinates();
	
			if (elem.type != "G"){
				CSim._addtomatrix(x1, y1, x2, y2, elem.type, this._matrizcircuito);
				CSim._addtomatrix(x0, y0, x1, y1, "w", this._matrizcircuito); 
				CSim._addtomatrix(x2, y2, xf, yf, "w", this._matrizcircuito);
			} else {
				CSim._groundnode = {x: x0, y: y0};	
			}
			
			if (elem.type == "V" && CSim._groundnode == ""){
				CSim._groundnode = {x: xf, y: yf};	
			}
		}
	},
	_mostrarnodos : function (){
		this._mostrandonodos = true;
		
		this._addelementstomatrix();
		this._encontrarnodos();
		
		CSimCanvas._nodeslayer.remove();
		CSimCanvas._nodeslayer = new Kinetic.Layer();
		
		var nodosmostrados = [];
		
		for (var j=this._ymin*2/this._malla; j<=this._ymax*2/this._malla; j+=2){	
			for (var i=this._xmin*2/this._malla; i<=this._xmax*2/this._malla; i+=2){
			
				var nodenumber = this._matriznodos[i][j];
				
				var str = (this._solution == "") ? nodenumber : "(" + this._solution[nodenumber] + "V)";
				if (typeof nodenumber == "number" && nodosmostrados.indexOf(nodenumber) < 0){
					var text = new Kinetic.Text({
						x: i*this._malla/2+2,
						y: j*this._malla/2+1,
						text: str,
						fontSize: 15,
						fontFamily: 'calibri',
						fontStyle: 'bold',
						fill: 'darkgreen'
					});
					CSimCanvas._nodeslayer.add(text);
					nodosmostrados.push(nodenumber);
				}
			}
		}
		CSimCanvas._stage.add(CSimCanvas._nodeslayer);
		CSimCanvas._nodeslayer.draw();
	},
	
	_generarnetlist : function (){
		
		this._netlist = [];
		this._everythingfine = true;
		
		for (var i in this.elements){
			if (this.elements[i].type != "G"){
			
				this.elements[i]._getelemcoordinates();
				
				var name = this.elements[i].name;
				var value = this.elements[i].value;
				
				var nodo1x = x0 * 2/this._malla;
				var nodo1y = y0 * 2/this._malla;
				var node1 = this._nearestnode(nodo1x, nodo1y);
				
				var nodo2x = xf * 2/this._malla;
				var nodo2y = yf * 2/this._malla;	
				var node2 = this._nearestnode(nodo2x, nodo2y);
				
				this._netlist.push([name, node1, node2, value]);
			}
		}
		
		//comprobar conectividad
		var conected = 0;
		for (var i=0; i<this._numnodes; i++){
			var conected = 0;
			for (var j=0; j<this._netlist.length; j++){
				if (this._netlist[j][1] == i || this._netlist[j][2] == i) conected++;
			}
			if (conected < 2) this._everythingfine = false;	
		}
		if (!this._everythingfine) this._say("Revisa el cableado!!");
	},
	
	_nearestnode : function (i, j){

			if (typeof this._matriznodos[i-1][j] == "number"){
				return this._matriznodos[i-1][j];
				
			} else if (typeof this._matriznodos[i+1][j] == "number"){
				return this._matriznodos[i+1][j];
				
			} else if (typeof this._matriznodos[i][j-1] == "number"){
				return this._matriznodos[i][j-1];
				
			} else if (typeof this._matriznodos[i][j+1] == "number"){
				return this._matriznodos[i][j+1];
				
			} else {
				this._everythingfine = false;
			}
	},

	_encontrarnodos : function(){

			var nodetemp = 0;
			var node = 0;
			var temptoreal = [];
		
			//duplicar la matriz de circuito
			for (var j=this._ymin*2/this._malla; j<=this._ymax*2/this._malla; j++){	
				for (var i=this._xmin*2/this._malla; i<=this._xmax*2/this._malla; i++){
					this._matriznodos[i][j] = this._matrizcircuito[i][j];
				}
			}
			
			for (var j=this._ymin*2/this._malla; j<=this._ymax*2/this._malla; j++){	
				for (var i=this._xmin*2/this._malla; i<=this._xmax*2/this._malla; i++){
				
					if( this._matriznodos[i][j] == "w"){
					
						var vtop = this._matriznodos[i][j-1];	
						var vleft = this._matriznodos[i-1][j];
						
						//nueva esquina
						if (vtop=="." && vleft=="."){
							this._matriznodos[i][j] = nodetemp;
							temptoreal[nodetemp]= nodetemp;
							nodetemp ++;
						}
						
						//continuación de cable horizontal
						if (vtop=="." && typeof vleft == "number"){
							this._matriznodos[i][j] = vleft;
						}
						
						//continuación de cable vertical
						if (vleft=="." && typeof vtop == "number"){
							this._matriznodos[i][j] = vtop;
						}
						
						//esquina
						if (typeof vtop == "number" && typeof vleft == "number"){
							
							//continuación de esquina
							if (vtop==vleft){
								this._matriznodos[i][j] = vtop;
							}
							
							//conflicto de esquina
							else {
								this._matriznodos[i][j] = nodetemp;
								
								for (var k=0; k<nodetemp; k++){
									if (k!=vtop && k!=vleft && (temptoreal[k]==temptoreal[vtop] || temptoreal[k]==temptoreal[vleft])){
										temptoreal[k]=nodetemp;
									}
								}
								
								temptoreal[nodetemp]=nodetemp;
								temptoreal[vtop]=nodetemp;
								temptoreal[vleft]=nodetemp;
								nodetemp++;
							}
						}
						
						//final de elemento
						if (this._elemtypes.indexOf(vtop) != -1 || this._elemtypes.indexOf(vleft) != -1){
							this._matriznodos[i][j] = nodetemp;
							temptoreal[nodetemp]=nodetemp;		
							nodetemp ++;			
						}
					}
				}
			}
			
			//reasignacion a nodos consecutivos
			for (var i=0; i<nodetemp; i++){
				var nodoocupado = false;
				
				for (var j=0; j<nodetemp; j++){
					if (temptoreal[j]==i){
						temptoreal[j]=node;
						nodoocupado = true;
					}
				}
				if (nodoocupado){node++;}
			}
			
			//asignación nodo tierra
			if (this._groundnode != ""){
				var gcel = this._matriznodos[this._groundnode.x*2/this._malla][this._groundnode.y*2/this._malla];
				
				if (typeof gcel == "number"){
					var gnode = temptoreal[gcel];
				
					for (var j=0; j<nodetemp; j++){
						if (temptoreal[j]==0){
							temptoreal[j]=gnode;
						} else if (temptoreal[j]==gnode){
							temptoreal[j]=0;
						}
					}	
				}			
			}
			
			//matriz de nodos final
			for (var j=this._ymin*2/this._malla; j<=this._ymax*2/this._malla; j++){	
				for (var i=this._xmin*2/this._malla; i<=this._xmax*2/this._malla; i++){
					if (typeof this._matriznodos[i][j] == "number"){
						this._matriznodos[i][j] = temptoreal[this._matriznodos[i][j]] ;
					}
				}
			}	
			
			this._numnodes = node;
	},
	
	_solveMNA : function (netlist){
		console.info('solveMNA started -- please be patient.');//z
		var tic = new Date().getTime();//z
		
		var nl = $M(eval(netlist));
		
		//Initialize
		var numElem = 0; 	// Number of passive elements.
		var numV = 0;		// Number of independent voltage sources
		var numO= 0;		// Number of op amps
		var numI = 0;		// Number of independent current sources
		var numNode = 0;	// Number of nodes, not including ground (node 0)
		
		var Elements = [];
		var Vsources = [];
		var Isources = [];
			
		for (i=0;i<nl.rows();i++){
			switch(nl.elements[i][0].charAt(0)){
				case 'R':
					console.info('read '+nl.elements[i][0]);
					Elements[numElem] = {};
						Elements[numElem].name = nl.elements[i][0];
						Elements[numElem].node1 = nl.elements[i][1];
						Elements[numElem].node2 = nl.elements[i][2];
						Elements[numElem].value = nl.elements[i][3];
					numElem ++;
					break;
				
				case 'C':
				case 'L':
					throw new Error('L & C are not supported yet'); //pendiente
					break;
				case 'V':
					Vsources[numV] = {};
						Vsources[numV].name = nl.elements[i][0];
						Vsources[numV].node1 = nl.elements[i][1];
						Vsources[numV].node2 = nl.elements[i][2];
						Vsources[numV].value = nl.elements[i][3];
					numV ++;
					break;
				case 'O':
					throw new Error('op amps are not supported yet'); //pendiente
					break;
				case 'I':
					Isources[numI] = {};
						Isources[numI].name = nl.elements[i][0];
						Isources[numI].node1 = nl.elements[i][1];
						Isources[numI].node2 = nl.elements[i][2];
						Isources[numI].value = nl.elements[i][3];
					numI ++;
					break;
				default:
					throw new Error('unsupported element ' + nl.elements[i][0] );
			}
			
			numNode = Math.max(nl.elements[i][1], Math.max(nl.elements[i][2], numNode) );
		}
		
		//Preallocate all of the cell arrays #############################################
		G = Matrix.Zero(numNode, numNode);
		V = [];
		I = Matrix.Zero(numNode,1);
		if ((numV + numO) != 0){
			B = Matrix.Zero(numNode, numV+numO); 
			C = Matrix.Zero(numV+numO, numNode);
			D = Matrix.Zero(numV+numO, numV+numO);
			E = Matrix.Zero(numV+numO, 1);
			J = [];
		}
		// -------------------------------------------------------------------------------
		
		//Fill the G matrix #############################################################
		//fill with conductances from netlist
		for (i=0; i<numElem;i++){
			n1 = Elements[i].node1;
			n2 = Elements[i].node2;
			switch ( Elements[i].name.charAt(0) ){
				case 'R':
					g = 1 / Elements[i].value;
					break;
					//TODO: incluir L y C
			}
			
			//if neither side of the element is connected to ground, then substract it 
			//from the appropiate location in matrix
			if ( n1!=0 && n2!=0 ){
				G.elements[n1-1][n2-1] = G.elements[n1-1][n2-1] - g;
				G.elements[n2-1][n1-1] = G.elements[n2-1][n1-1] - g;
			}
			
			//If node 1 is *NOT* connected to ground, add element to diagonal of matrix
			if (n1!=0)
				G.elements[n1-1][n1-1] = G.elements[n1-1][n1-1] + g;
				
			//Idem for node2
			if (n2!=0)
				G.elements[n2-1][n2-1] = G.elements[n2-1][n2-1] + g;
			
		}
		//G matrix is finished ---------------------------------------------------
		
		//Fill the I matrix
		for (j=0;j<numNode;j++){
			for (i=0;i<numI;i++){
				if ( Isources[i].node1 == j )
					I.elements[j] -= Isources[i].value;
				else if ( Isources[i].node2 == j )
					I.elements[j] += Isources[i].value;
			}
		}
		//Fill the V matrix ##############################################
		for (i=0;i<numNode;i++)
			V[i] = 'v_'+(i+1); // *** añadido el '+1', el elemento en la posición i representa el nodo i+1, ya que no cuenta el 0, tierra ***
		
		if ( ( numV + numO ) != 0 ){
			//Fill the B matrix
			//first handle the case of the independent voltage sources
			for (i=0; i<numV; i++){
				for(j=0; j<numNode; j++){
					if ( Vsources[i].node1 - 1 == j )
						B.elements[j][i] = 1;
					else if (Vsources[i].node2 - 1 == j)
						B.elements[j][i] = -1;
				}
			}
			// TODO: Now handle the case of the Op Amp
			
			//Fill the C matrix ####################################################
			for (i=0; i<numV; i++){
				for (j=0; j<numNode; j++){
					if ( Vsources[i].node1 - 1 == j )
						C.elements[i][j] = 1;
					else if ( Vsources[i].node2 - 1 == j )
						C.elements[i][j] = -1;
				}
			}
			//TODO: now handle the case of the Op Amp
			
			//Fill the D matrix ###################################################
			//The D matrix is non-zero only for CCVS and VCVS (not included in this
			//simple implementation of SPICE)
			
			//Fill the E matrix ###################################################
			
			for (i=0;i<numV;i++){
				E.elements[i][0] = Vsources[i].value;
			}
			
			//Fill the J matrix ###################################################
			for ( i=0;i<numV;i++){
				J[i] = 'I_'+Vsources[i].name;
			}
				//TODO: op amps
			//The J matrix is finished --------------------------------------------
		}
		
		//Form the A, X and Z matrices
		if ( ( numV + numO ) != 0 ){
			Aux1 = C.augment(D);
			A = G.augment(B);
			
			for(i=0;i<Aux1.rows();i++)
				A.elements[A.rows()] = Aux1.elements[i];
				
			X = V;
			for(i=0;i<J.length;i++)
				X[X.length] = J[i];
				
			Z = I.dup();
			for(i=0;i<E.rows();i++)
				Z.elements[Z.rows()] = E.elements[i];
		
		}else{
			A = G.dup();
			X = V;
			Z = I.dup();
		}
		
		this._say('<b>A</b>='+A.inspect());
		this._say('<b>X</b>=['+X+']');
		this._say('<b>Z</b>='+Z.inspect());
	
		
		if (A.rank() == A.rows()){
			this.Xsol = A.inv().x(Z);
			
			this._say('<b>['+X+']</b> = '+this.Xsol.inspect());
			
			this._say('solved in '+Math.round( new Date().getTime() - tic ) + 'ms.')
			
			this._solution = [0];
			for (var i=0; i<this.Xsol.elements.length; i++){
				this._solution.push(this._significantDigits(this.Xsol.elements[i][0], 4));
			}
		}else
			throw new Error('A is singular!! A.rank()='+A.rank()+' < A.rows()='+A.rows());
	
	},
	_showSolution : function(){
	
		CSimCanvas._solutionlayer.remove();
		CSimCanvas._solutionlayer = new Kinetic.Layer();
		CSimCanvas._stage.add(CSimCanvas._solutionlayer);
		
		var nsources = this._numnodes;
		
		for (var i=0; i<this._netlist.length; i++){
		
			var elemname = this._netlist[i][0];
			var elem = this.elements[elemname];
			var labelpos = [elem.label.getAttr("x"), elem.label.getAttr("y")];
			
			switch(elem.type){
				case "R":
					elem.r = this._netlist[i][3];
					elem.v = this._significantDigits(this._solution[this._netlist[i][1]]-this._solution[this._netlist[i][2]], 4);
					elem.i = this._significantDigits(elem.v / this._netlist[i][3], 4);
					var soltext = "I=" + elem.i + "  ∆V=" + elem.v;
					break;
				case "V":
					elem.v = this._netlist[i][3];
					elem.i = this._solution[nsources];
					nsources++;
					var soltext = "I=" + elem.i;
					break;				
				default:
					var soltext = "";
					break;
			}
			
			var text = new Kinetic.Text({
				x: labelpos[0],
				y: labelpos[1]-20,
				text:  soltext,
				fontSize: 18, //TODO ajustar a tamaño pantalla
				fontFamily: 'calibri',
				fontStyle: 'bold',
				fill: 'darkblue',
				draggable: true
			});
			text.on('mousedown', function(){
				CSimCanvas._wiring = false;
			});
			text.on('mouseup', function(){
				CSimCanvas._wiring = true;
			});	
			
			CSimCanvas._solutionlayer.add(text);
		}
		CSimCanvas._solutionlayer.draw();
	},
	_clearSolution : function(){
		CSimCanvas._solutionlayer.remove();
		CSimCanvas._solutionlayer = new Kinetic.Layer();
		CSimCanvas._stage.add(CSimCanvas._solutionlayer);
		CSim._solution = "";
	},
	setTest : function(){
		// test
		window.addEventListener('keydown', keywindow, false);
	},
	_mostrarmatriznodos : function(){
			this._encontrarnodos();
			var str = "\n";
			for (var j=this._ymin*2/this._malla; j<=this._ymax*2/this._malla; j+=2){	
				for (var i=this._xmin*2/this._malla; i<=this._xmax*2/this._malla; i+=2){
					(this._matriznodos[i][j] == ".") ? str += " " : str += this._matriznodos[i][j];
				}
				str += "\n";
			}
			console.log(str);
	},
	_mousedown : function(){
		if (CSim._selectedimg != ""){
			CSim._selectedimg.setAttr("strokeEnabled", false);
			CSimCanvas._circuitlayer.draw();
			CSim._selectedimg = "";
		}
	},
	_keywindow : function(e){
		//console.info(e.which);
			// test - tecla 'r' para rotar elementos
			if (e.which == 82){
				if (CSim._selectedimg != ""){
					CSim._selectedimg.rotate(Math.PI/2);
					CSimCanvas._circuitlayer.draw();
					CSim._mostrarnodos(); //
				}
			};
			// test - tecla 'm' para mostrar los nodos por consola
			if (e.which == 77){
				CSim._mostrarmatriznodos();
			};
			// test - tecla 'supr' para borrar elementos
			if (e.which == 46){
				if (CSim._selectedimg != ""){
					var elem = CSim._selectedimg.getAttr("elem");
					delete CSim.elements[elem.name];
					
					elem.label.destroy();
					CSim._selectedimg.destroy();
					CSimCanvas._circuitlayer.draw();
					CSimCanvas._labellayer.draw();
					CSim._mostrarnodos(); //
				}
			};
	},
	_say : function(m){
		$('#console').addClass('ui-state-highlight').html(m);
	},
	_significantDigits : function(n, digits){
		n = Math.round(n*Math.pow(10,7))/Math.pow(10,7);
		if (n == 0) return 0;
		var sign = Math.abs(n)/n;
		var intdigits = Math.ceil( Math.log(Math.abs(n)) / Math.LN10 );
		var factor = Math.pow(10, digits-intdigits);
		return Math.round(n*factor)/factor;
	}
}

CSimElement = function(menuName, x, y){
	this.type = menuName.charAt(0);
	name = this.type+CSim.elemDef[this.type]['counter'];
	if (this.type == "G") name = "";
	this.name = name;
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
CSimElement.prototype._addStyle = function(){
	this.image.on("mouseover", function(){ document.body.style.cursor =  "pointer"; });
	this.image.on("mouseout", function() { document.body.style.cursor = "default"; });
}
CSimElement.prototype._addListeners = function(){
	this.image.on( 'dblclick dbltap' , this._dblclick );
	this.image.on( 'dragstart', this._dragstart );
	this.image.on( 'dragend', this._dragend );
}
CSimElement.prototype._dblclick = function(){
	CSimEditor.show(this);
}
CSimElement.prototype._dragstart = function(e){
	CSim._selectedimg = this;
	this.setAttr("strokeEnabled", true);
	CSimCanvas._circuitlayer.draw();

	CSimCanvas._wiring = false;
	
	var imagepos = [this.getAttr("x"), this.getAttr("y")];
	var labelpos = [this.getAttr("label").getAttr("x"), this.getAttr("label").getAttr("y")];
	console.info(labelpos);
	CSim._labeloffset = [labelpos[0]-imagepos[0],labelpos[1]-imagepos[1]];
}
CSimElement.prototype._dragend = function(e){
	CSimCanvas._wiring = true;
	
	var x = this.getAttr("x");
	var y = this.getAttr("y");
	
	var p = CSimCanvas._ajustaramalla(x,y);
	
	this.setAttr("x",p[0]);
	this.setAttr("y",p[1]);
	
	CSimCanvas._circuitlayer.draw();
	
	var elem = this.getAttr('elem');
		elem.x = p[0];
		elem.y = p[1];
	
	this.getAttr("label").setAttr("x", p[0] + CSim._labeloffset[0]);
	this.getAttr("label").setAttr("y", p[1] + CSim._labeloffset[1]);
	CSimCanvas._labellayer.draw();
	CSim._clearSolution(); //
	CSim._mostrarnodos(); //
}
CSimElement.prototype._loadLabel = function(){

	this._getelemcoordinates();
	
	if (x0==xf){
		tx = x0 - 35;
		ty = (y0 + yf)/2;
	} else {
		tx = (x0 + xf)/2;
		ty = y0 - 30;
	}
	
	var str = (this.type == "G") ? "" : this.name + " = " + this.value + CSim.elemDef[this.type].symbol;
	var text = new Kinetic.Text({
		x: tx-35,
		y: ty-12,
		text: str,
		fontSize: 22,//TODO ajustar a tamaño pantalla
		fontFamily: 'calibri',
		fill: '#000099',
		name: this.name,
		draggable: true
	});
	
	text.on('mousedown', function(){
		CSimCanvas._wiring = false;
	});
	text.on('mouseup', function(){
		CSimCanvas._wiring = true;
	});	
	
	this.label = text;
	
	CSimCanvas._labellayer.add(text);
	CSimCanvas._labellayer.draw();
	
	return text;
}
CSimElement.prototype._getelemcoordinates = function(){
	
	var p=[this.image.getAttr("x"), this.image.getAttr("y")];
	var rotation = this.image.getAttr("rotation") + CSim.elemDef[this.type].iniRotation;
	
	if (rotation % Math.PI == 0){
	
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
	
	if (rotation % (2*Math.PI) >= Math.PI){
		x0t = xf; xf = x0; x0 = x0t;
		x1t = x2; x2 = x1; x1 = x1t;	
		y0t = yf; yf = y0; y0 = y0t;
		y1t = y2; y2 = y1; y1 = y1t;			
	}
}
CSimEditor = {
	elem: null,
	input: document.getElementById('value'),
	label: document.getElementById('label'),
	init: function(){
		document.getElementById('save').addEventListener('click tap', CSimEditor.save );
	  	document.getElementById('cancel').addEventListener('click tap', CSimEditor.hide );
	},
	save: function(){
		CSimEditor.elem.value = CSimEditor.input.value;
		CSimEditor.elem.label.setAttr("text", CSimEditor.elem.name + " = " + CSimEditor.elem.value + CSim.elemDef[CSimEditor.elem.type].symbol);
		CSimCanvas._labellayer.draw();
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
	drop : function(e,ui){
		e.preventDefault();
		
	  	var id = ui.draggable.context.id;
		var mpos = [e.clientX, e.clientY];
		var ipos = ui.helper.offset();
		var offset = [mpos[0]-ipos.left-CSim._elemsize/2, mpos[1]-ipos.top-CSim._elemsize/2];
		
	  	if(id.indexOf('menu') <= 0) return true;
	  	var pos = CSimCanvas._getcoordinates(e);
		var pos = CSimCanvas._ajustaramalla(pos[0] - offset[0], pos[1] - offset[1]);
	  	
		elem = new CSimElement(id, pos[0], pos[1]);
	}
}

CSimCanvas = {
	_wiring: true,
	_drawing : false,
	_dragging : false,
	_load : function(){
		this.anchura = $("#contenedor").width();
		this.altura = $("#contenedor").height();
		
		//TODO: incluir elemento contenedor si no existe
		this.contenedor=document.getElementById("contenedor");

		this._stage = new Kinetic.Stage({
			container: 'contenedor',
			width: this.anchura,
			height: this.altura
		});
		
		this._backgroundlayer = new Kinetic.Layer();
		this._circuitlayer = new Kinetic.Layer();
		this._labellayer = new Kinetic.Layer();
		this._nodeslayer = new Kinetic.Layer();
		this._solutionlayer = new Kinetic.Layer();
		
		this._stage.add(this._backgroundlayer);
		this._stage.add(this._circuitlayer);
		this._stage.add(this._labellayer);
		this._stage.add(this._nodeslayer);
		this._stage.add(this._solutionlayer);
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
		this._backgroundlayer.on('mousedown touchstart', this._mousedown);
		this._backgroundlayer.on('mousemove touchmove', this._mousemove);
		this._backgroundlayer.on('mouseup touchend', this._mouseup);
	},
	_addElement : function(elem){
		imageObj = new Image();
		imageObj.name = elem.name;
		imageObj.onload = function(e) {
			var elem = CSim.elements[e.target.name];
			var image = new Kinetic.Image({
				x: elem.x,
				y: elem.y,
				image: imageObj,
				width: CSim._elemsize,
				height: CSim._elemsize,
				offset: [CSim._elemsize/2, CSim._elemsize/2],
				stroke: "blue",
				strokeWidth: 0.5,
				strokeEnabled: false,
				draggable: true
			});

			image.setAttr("selected", true);
			CSim._selectedimg = image;
			
			elem.image = image;
			image.setAttr('elem', elem);
			
			var label = elem._loadLabel();
			elem.label = label;
			image.setAttr('label', label);
			
			elem._addListeners();
			elem._addStyle();
			
			CSimCanvas._circuitlayer.add(image);
			CSimCanvas._stage.add(CSimCanvas._circuitlayer);
			
			CSim._clearSolution(); //
			CSim._mostrarnodos(); //
		};
		imageObj.src = "img/"+elem.type+".png";
	},
	_getcoordinates : function (ev){
			try{
				if( $.support.touch && event.touches.item(0) != null) 
					ev = event.touches.item(0);
				
			}catch(e){ console.error(e); }
			
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
			
			if( x-CSimCanvas._x0 < 2* CSim._malla && y-CSimCanvas._y0 < 2*CSim._malla ) return false;
			
			if (CSimCanvas._dir == "" && Math.abs(x-CSimCanvas._x0) + Math.abs(y-CSimCanvas._y0) > 3*CSim._malla){
				(Math.abs(x-CSimCanvas._x0)>2*CSim._malla) ? CSimCanvas._dir = "horizontal" : CSimCanvas._dir = "vertical";
			}
			
			// si la dirección ya está clara, la mantiene
			switch (CSimCanvas._dir){
				
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
	_mouseup : function (ev){ console.info(ev);
		
		var p = CSimCanvas._getcoordinates(ev);
		p = CSimCanvas._ajustaramalla(p[0], p[1]);
		
		if (CSimCanvas._drawing){
		
			if (CSimCanvas._x0 != CSimCanvas._x1 || CSimCanvas._y0 != CSimCanvas._y1){
				
				CSimCanvas._circuitlayer.add(CSimCanvas._templine);
				CSimCanvas._circuitlayer.draw();
				
				CSim._addtomatrix(CSimCanvas._x0, CSimCanvas._y0, CSimCanvas._x1, CSimCanvas._y1, 'w', CSim._matrizcables);
				CSim._addtomatrix(CSimCanvas._x1, CSimCanvas._y1, CSimCanvas._x2, CSimCanvas._y2, 'w', CSim._matrizcables);
			}
	
			CSimCanvas._drawing = false;
			CSimCanvas._drawinglayer.remove();	

			CSim._clearSolution();
			CSim._mostrarnodos();			
		}
	}
}

