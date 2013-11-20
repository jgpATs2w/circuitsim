CSim = {
	elemDef : {
			R:{
				counter:0,
				unit:'ohms',
				label:'resistencia',
				defValue: 10
			},
			V:{
				counter:0,
				unit:'voltios',
				label:'Fuente Tensión Ideal',
				defValue: 1.5
			},
			C:{
				counter:0,
				unit:'faradios',
				label:'Condensador',
				defValue: 2
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
		
		document.getElementById('Cmenu').addEventListener('dragstart', CSimDragop.drag);
	    document.getElementById('Rmenu').addEventListener('dragstart', CSimDragop.drag);
	    document.getElementById('Vmenu').addEventListener('dragstart', CSimDragop.drag);
	    document.getElementById('Wmenu').addEventListener('click', function(){
	    	this.className = (this.className == "pressedImg") ? "" : "pressedImg";
	    	CSimCanvas._wiring = CSimCanvas._wiring ? false : true;
	    });
	  
	    document.getElementById('contenedor').addEventListener('drop', CSimDragop.drop);
	    document.getElementById('contenedor').addEventListener('dragover', CSimDragop.allowDrop);
	    
	    window.addEventListener('keydown', this._keywindow, false);
	},
	_inicializar : function (){
		this._elementdrag = false;
		this._mostrandonodos = false; //test
		this._elemdragged = "";
		this._tipoelemento = "w";
		this._groundnode = "";
	
		this._malla = 12;
		this._elemsize = this._malla*6;
		this._cablewidth = 2;
		
		this._matrizcircuito = [];
		this._matriznodos = [];
	
		this._netlist = [];
		
		this._numelemarray = [];
		this._elemtypes = "RVC";
	
		this._numelemtotal = 0;
	
		this._xmin = 10000;
		this._ymin = 10000;
		this._xmax = 0;
		this._ymax = 0;
		
		CSimEditor.init();
	},
	_inicialiazarmatrices : function (){
		for (var i=0; i<CSimCanvas.anchura*2/this._malla; i++){
			this._matrizcircuito[i] = [];
			this._matriznodos[i] = [];
			for (var j=0; j<CSimCanvas.altura*2/this._malla; j++){		
				this._matrizcircuito[i][j] = ".";
				this._matriznodos[i][j] = ".";
			}
		}
	},
		
	// añadir elementos y cables dibujados a la matriz del circuito
		
	_addtomatrix : function (x0, y0, xf, yf, tipo){
		
			for (var i=Math.min(x0,xf)*2/this._malla; i<=Math.max(x0,xf)*2/this._malla; i++){
				for (var j=Math.min(y0,yf)*2/this._malla; j<=Math.max(y0,yf)*2/this._malla; j++){
					this._matrizcircuito[i][j] = tipo;
				}
			}
			
			this._xmin = Math.min(this._xmin, x0, xf);
			this._ymin = Math.min(this._ymin, y0, yf);
			this._xmax = Math.max(this._xmax, x0, xf);
			this._ymax = Math.max(this._ymax, y0, yf);
			
	},
	// añadir elementos al array de elementos y añadirles etiquetas
		
	_addelement : function (x0, y0, xf, yf, tipo){
			
			this._numelemtotal++;
			this._numelemarray[tipo]++;
			
			name = tipo + this._numelemarray[tipo];
			
			this._elementos.push({name: name, x0: x0, y0: y0, xf: xf, yf:yf, value: "?"});
			//TODO: instanciar clase elemento
			
			//añadir la etiqueta --------
			
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
			
			text.setAttr("elemval", "");
			
			text.on("mousedown", function(){
				textclick = true;
				textlayer.draw();
				elementpointer = this;
				$("#inputvalue").val(this.getAttr("elemval"));
				$("#inputvalue").focus();
				
			});
			
			text.on("mouseup", function(){
				textclick = false;
			});
			
			text.on("mouseover", function(){
				document.body.style.cursor =  "pointer";
		    });
				
		    text.on("mouseout", function() {
				document.body.style.cursor = "default";
		    });
			
			this._textlayer.add(text);
			this._textlayer.draw();
			
			// fin de etiqueta -------	
	},
	// fin del las funciones de dibujo ***************************************************
	//funciones auxiliares
	
	//funciones de los botones
		
	_borrartodo : function (){
		with(CSim){
			_circuitlayer.remove();
			_textlayer.remove();
			
			_circuitlayer = new Kinetic.Layer();
			_textlayer = new Kinetic.Layer();
			
			_stage.add(circuitlayer);
			_stage.add(textlayer);
			
			_inicializar();
			_inicialiazarmatrices();
		}	
	},
	_dibujarcables : function (){
			this._tipoelemento = "w";
	},
	_dibujarresistencias : function (){
			this._tipoelemento = "R";
	},
		
	_dibujarfuentes : function (){
			this._tipoelemento = "V";
	},
	_mostrarnodos : function (){
		
			if(this._mostrandonodos){
				this._nodeslayer.remove();
				this._nodeslayer = "";
				this._mostrandonodos = false;
			} else {
			
				this._mostrandonodos = true;
				
				this._encontrarnodos();
			
				this._nodeslayer = new Kinetic.Layer();
				this._nodosmostrados = [];
				
				for (var j=this._ymin*2/this._malla; j<=this._ymax*2/this._malla; j+=2){	
					for (var i=this._xmin*2/this._malla; i<=this._xmax*2/this._malla; i+=2){
					
						nodotext = matriznodos[i][j];
						
						if (typeof nodotext == "number" && nodosmostrados.indexOf(nodotext) < 0){
							text = new Kinetic.Text({
								x: i*this._malla/2+2,
								y: j*this._malla/2+1,
								text: nodotext,
								fontSize: 15,
								fontFamily: 'calibri',
								fontStyle: 'bold',
								fill: 'darkgreen'
							});
							this._nodeslayer.add(text);
							this._nodosmostrados.push(nodotext);
						}
					}
				}
				this._stage.add(nodeslayer);
			}
		},
	// creación de la netlist		
	_generarnetlist : function (){
		
			this._encontrarnodos();
			
			this._netlist = [];
			
			this._everythingfine = true;
			
			for (var i=0; i<this._elementos.length; i++){
				
				name = this._elementos[i].name;
				value = this._elementos[i].value;
				
				nodo1x = this._elementos[i].x0 * 2/this._malla;
				nodo1y = this._elementos[i].y0 * 2/this._malla;
				node1 = this._nearestnode(this._nodo1x, this._nodo1y);
				
				nodo2x = this._elementos[i].xf * 2/this._malla;
				nodo2y = this._elementos[i].yf * 2/this._malla;	
				node2 = this._nearestnode(nodo2x, nodo2y)
				
				this._netlist.push([name, node1, node2, value])
			}
			
			if (!this._everythingfine){alert("hay algo mal conectado!")};
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
	//función de busqueda de los nodos del circuito
	_encontrarnodos : function(){

			nodetemp = 0;
			node = 0;
			temptoreal = [];
		
		
			//duplicar la matriz de malla
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
						//if (vtop == "#" || vleft == "#"){
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
			
			
			//asignación del nodo 0 al nodo tierra (si está definido)
			// if (groundnode != ""){
			
				// var cel = matriznodos[groundnode.x][groundnode.y];
				
				// if (cel!="#" && cel!="."){
				
					// var gnode = temptoreal[cel];
					// console.log("gnode", gnode); //
					
					// for (var j=0; j<nodetemp; j++){
						// if (temptoreal[j]==0){
							// temptoreal[j]=gnode;
						// } else if (temptoreal[j]==gnode){
							// temptoreal[j]=0;
						// }
					// }	
				// }			
			// }
			
			
			//matriz de nodos final
			for (var j=this._ymin*2/this._malla; j<=this._ymax*2/this._malla; j++){	
				for (var i=this._xmin*2/this._malla; i<=this._xmax*2/this._malla; i++){
					if (typeof this._matriznodos[i][j] == "number"){
						this._matriznodos[i][j] = temptoreal[this._matriznodos[i][j]] ;
					}
				}
			}	
	},
	
	_solveMNA : function (netlist){
			console.info('solveMNA started -- please be patient.');
			
			this._nl = $M(eval(netlist));
			
			//Initialize
			numElem = 0; 	// Number of passive elements.
			numV = 0;		// Number of independent voltage sources
			numO= 0;		// Number of op amps
			numI = 0;		// Number of independent current sources
			numNode = 0;	// Number of nodes, not including ground (node 0)
			
			Elements = [];
			Vsources = [];
			Isources = [];
				
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
				
				this._say('solved in '+Math.round( new Date().getTime() - this._tic ) + 'ms.')
			}else
				throw new Error('A is singular!! A.rank()='+A.rank()+' < A.rows()='+A.rows());
		
		},
	
	setTest : function(){
		// test
		window.addEventListener('keydown', keywindow, false);
		
	},
	_mostrarmatriznodos : function(){
		
			this._encontrarnodos();
		
			var str = "";
			for (var j=this._ymin*2/this._malla; j<=this._ymax*2/this._malla; j+=2){	
				for (var i=this._xmin*2/this._malla; i<=this._xmax*2/this._malla; i+=2){
					(this._matriznodos[i][j] == ".") ? str += " " : str += this._matriznodos[i][j];
				}
				str += "\n";
			}
			console.log(str);
			//this._say(str);	
	},
	_keywindow : function(e){
		//console.info(e.which);
			// test - tecla 'r' para rotar elementos mientras se les está arastrando
			if (e.which == 82){
				elemdragged.rotate(Math.PI/2);
				e.preventDefault();
			};
		
			// test - tecla 'm' para mostrar los nodos por consola
			if (e.which == 77){
				CSim._mostrarmatriznodos();
			};
	},
	_say : function(m){
		console.info(m);
	}
}


