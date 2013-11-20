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
		CSim._addelementstomatrix();
		CSim._encontrarnodos();
		CSim._generarnetlist();
		CSim._mostrarmatriznodos();//test
		CSim._solveMNA(CSim._netlist);
		CSim._mostrarnodos();
		CSim._showSolution();
		
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
	// _borrartodo : function (){
		// with(CSim){
			// _circuitlayer.remove();
			// _labellayer.remove();
			
			// _circuitlayer = new Kinetic.Layer();
			// _labellayer = new Kinetic.Layer();
			
			// _stage.add(circuitlayer);
			// _stage.add(textlayer);
			
			// _inicializar();
			// _inicialiazarmatrices();
		// }	
	// },
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
		if (!this._everythingfine) console.log("Hay elementos mal conectados!");
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
		console.info(m);
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


