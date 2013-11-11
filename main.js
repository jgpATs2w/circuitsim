//centrado y listeners para el contenedor

anchura = Math.min(1100,$(window).width())-300;
altura = Math.min(500,$(window).height())-50;

contenedor=document.getElementById("contenedor");

$("#contenedor").width(anchura);
$("#contenedor").height(altura);

$("#contenedor").offset({
	top: ($(window).height() - altura)/2, 
	left: ($(window).width() - anchura)/2 + 120
});

contenedor.addEventListener('mousedown', mousedown, false);
contenedor.addEventListener('mousemove', mousemove, false);
contenedor.addEventListener('mouseup', mouseup, false);



//parametros iniciales
inicializar();

function inicializar(){
	drawing = false;
	textclick = false;
	elementdrag = false;
	mostrandonodos = false; //test
	elemdragged = "";
	tipoelemento = "w";
	groundnode = "";

	malla = 12;
	elemsize = malla*6;
	cablewidth = 2;
	
	matrizcircuito = [];
	matriznodos = [];
	
	elementos = [];
	netlist = [];
	
	elemtypes = ["R", "V", "C"]; // añadir más..
	numelemarray = [];

	numelemtotal = 0;

	xmin = 10000;
	ymin = 10000;
	xmax = 0;
	ymax = 0;
}



// inicialización de matrices
inicialiazarmatrices();


function inicialiazarmatrices(){
	for (var i=0; i<anchura*2/malla; i++){
		matrizcircuito[i] = [];
		matriznodos[i] = [];
		for (var j=0; j<altura*2/malla; j++){		
			matrizcircuito[i][j] = ".";
			matriznodos[i][j] = ".";
		}
	}
}



// definicion de las capas de dibujo de kinetic

stage = new Kinetic.Stage({
	container: 'contenedor',
	width: anchura,
	height: altura
});

backgroundlayer = new Kinetic.Layer();
circuitlayer = new Kinetic.Layer();
panellayer = new Kinetic.Layer();
draglayer = new Kinetic.Layer();
textlayer = new Kinetic.Layer();
nodeslayer = "";

stage.add(backgroundlayer);
stage.add(circuitlayer);
stage.add(panellayer);
stage.add(draglayer);
stage.add(textlayer);



//creación de la malla de puntos

//el borde
var fondo = new Kinetic.Rect({
	x: 0,
	y: 0,
	width: anchura,
	height: altura,
	fill: "white",
	stroke: "black",
	strokeWidth: 4
});
backgroundlayer.add(fondo);		 

//y los puntos
for (var i=malla; i<anchura; i+=malla){
	for (var j=malla; j<altura; j+=malla){	
		var rect = new Kinetic.Rect({
			x: i-1,
			y: j-1,
			width: 2,
			height: 2,
			fill: "darkgray",
		});
		
		backgroundlayer.add(rect);
	}
}
backgroundlayer.draw();




// creación de las imágenes de los elementos ******************************************++

for (i=0; i<elemtypes.length; i++){
	numelemarray[elemtypes[i]]=0;
	createelems(i);
}


function createelems(index){

	var img = new Image();

	img.onload = function() {
		createpanelelem(this, index);
		createdraggingelem(this, index);
	}
	
	img.src = "img/" + elemtypes[index] + ".png";

}


//creación de los elementos fijos (el panel en sí)
function createpanelelem(imagen, index){
		
		var elemimg = new Kinetic.Image({
			x: 60,
			y: 60 + index*(elemsize + malla),
			image: imagen,
			width: elemsize,
			height: elemsize,
			offset: [elemsize/2, elemsize/2],
			stroke:"#9966FF",
			strokeWidth:2
		});

		panellayer.add(elemimg);
		panellayer.draw();
		
}

	
//creación de los elementos arrastrables
function createdraggingelem(imagen, index){
	
	var elemimgdrag = new Kinetic.Image({
		x: 60,
		y: 60 + index*(elemsize + malla),
		image: imagen,
		width: elemsize,
		height: elemsize,
		draggable: true,
		offset: [elemsize/2, elemsize/2]
	});		

	elemimgdrag.setAttr("elemindex", index);
	//elemimgdrag.setAttr("rotation", 0);
	
	
	//interactividad de los elementos
	
	elemimgdrag.on("mousedown", function(){
		elementdrag = true;
		elemdragged = this;
	});

	
	elemimgdrag.on("mouseup", function(){
		elementdrag = false;
		elemdragged = "";
		
		x = this.getAttr("x");
		y = this.getAttr("y");
		
		ajustaramalla();
		
		this.setAttr("x",x);
		this.setAttr("y",y);
		
		draglayer.draw();
		
		//determina la posición de los extremos del elemento en función de la posición de la imagen
		if (this.getAttr("rotation") % Math.PI == 0){
		
			x0 = x - elemsize/2;
			xf = x + elemsize/2;
			y0 = yf = y1 = y2 = y;
			
			x1 = x0 + malla;
			x2 = xf - malla;
			
		} else {
		
			x0 = xf = x1 = x2 = x;
			y0 = y - elemsize/2;
			yf = y + elemsize/2;
			
			y1 = y0 + malla;
			y2 = yf - malla;
		}
		
		
		//añade el elemento al circuito
		var tipoelem = elemtypes[index];
		addtomatrix(x1, y1, x2, y2, tipoelem);
		addelement(x1, y1, x2, y2, tipoelem);

		//añade una 'unidad' de cable en cada extremo
		addtomatrix(x0, y0, x1, y1, "w"); 
		addtomatrix(x2, y2, xf, yf, "w");
		
		//crea un nuevo elemento arrastable en el panel
		createdraggingelem(this.getAttr("image"), this.getAttr("elemindex"));
	});

	
	elemimgdrag.on("mouseover", function(){
		document.body.style.cursor =  "pointer";
	});
		
	elemimgdrag.on("mouseout", function() {
		document.body.style.cursor = "default";
	});
	
	
	draglayer.add(elemimgdrag);
	draglayer.draw();	
}

// fin de la creación de las imágenes de los elementos **************************************




//funciones de dibujo *****************************

function mousedown(ev){
	
	if (textclick || elementdrag){return;}
	
	getcoordinates(ev);	
	ajustaramalla();
	
	groundnode = {x: x*2/malla, y: y*2/malla}; //test zzzzz
	
	drawing = true;
	dir = "";
	
	x0 = x;
	y0 = y;
	x1 = x;
	y1 = y;
	
	// test - old - dibujado de elementos con ratón
	if (tipoelemento == "w"){color = "black";}//
	if (tipoelemento == "R"){color = "red";}//
	if (tipoelemento == "V"){color = "limegreen";}//
	
	drawinglayer = new Kinetic.Layer();
	
	templine = new Kinetic.Line({
		points: [x0, y0, x0, y0],
        stroke: color,
        strokeWidth: cablewidth,
        lineCap: 'round',
        lineJoin: 'round'
     });
	 
    drawinglayer.add(templine); 
	stage.add(drawinglayer);
	
}	



function mousemove(ev){
	
	if (drawing){
	
		getcoordinates(ev);
		ajustaramalla();
		
		
		// determina la dirección inicial del trazo
		if (dir == "" && Math.abs(x-x0) + Math.abs(y-y0) > 3*malla){
			(Math.abs(x-x0)>2*malla) ? dir = "horizontal" : dir = "vertical";
		}
		
		// si la dirección ya está clara, la mantiene
		switch (dir){
			
			case "horizontal":
				x1 = x;
				y1 = y0;
				break;
				
			case "vertical":
				x1 = x0;
				y1 = y;
				break;
				
			default:
				if (Math.abs(x-x0) > Math.abs(y-y0)){
					x1 = x;
					y1 = y0;
				} else {
					x1 = x0;
					y1 = y;
				}
				break;
		}	
		
		
		if (tipoelemento == "w"){
			x2 = x;
			y2 = y;
		} else {
			x2 = x1;
			y2 = y1;
		}
			
		templine.setAttr("points", [x0, y0, x1, y1, x2, y2]);
		
		drawinglayer.draw();
		
	}
}


function mouseup(ev){

	getcoordinates(ev);
	ajustaramalla();
	
	if (drawing){
	
		if (x0 != x1 || y0 != y1){
			
			circuitlayer.add(templine);
			circuitlayer.draw();
			
			if (tipoelemento != "w"){
				addelement(x0, y0, x1, y1, tipoelemento);
			}
			
			addtomatrix(x0, y0, x1, y1, tipoelemento);
			addtomatrix(x1, y1, x2, y2, tipoelemento);
		
		}

		drawing = false;
		drawinglayer.remove();			
	}
}



// añadir elementos y cables dibujados a la matriz del circuito

function addtomatrix(x0, y0, xf, yf, tipo){

	for (var i=Math.min(x0,xf)*2/malla; i<=Math.max(x0,xf)*2/malla; i++){
		for (var j=Math.min(y0,yf)*2/malla; j<=Math.max(y0,yf)*2/malla; j++){
			matrizcircuito[i][j] = tipo;
		}
	}
	
	xmin = Math.min(xmin, x0, xf);
	ymin = Math.min(ymin, y0, yf);
	xmax = Math.max(xmax, x0, xf);
	ymax = Math.max(ymax, y0, yf);
	
	
	// test, para que actualice los nodos si se están mostrando al añadir cables y elementos
	if (mostrandonodos){ 
		nodeslayer.remove();
		nodeslayer = "";
		mostrandonodos = false;
		mostrarnodos();
	}
	
}


// añadir elementos al array de elementos y añadirles etiquetas

function addelement(x0, y0, xf, yf, tipo){
	
	numelemtotal++;
	numelemarray[tipo]++;
	
	var name = tipo + numelemarray[tipo];
	
	elementos.push({name: name, x0: x0, y0: y0, xf: xf, yf:yf, value: "?"});
	e = new Element(name);
	e.edit();
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
		fontSize: 22,
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
	
	textlayer.add(text);
	textlayer.draw();
	
	// fin de etiqueta -------
	
}

// fin del las funciones de dibujo ***************************************************




// asignar valores a los elementos del circuito

$("#inputvalue").keyup(function(){
	elementpointer.setAttr("elemval", $("#inputvalue").val());
	elementpointer.setText(elementpointer.getAttr("name") + " = " + $("#inputvalue").val());
	textlayer.draw();
	
	for (var i=0; i<elementos.length; i++){
		if (elementos[i].name == elementpointer.getAttr("name")){elementos[i].value =  $("#inputvalue").val();}
	}
});




//funciones auxiliares

function getcoordinates(ev){
	x = ev.clientX - $("#contenedor").position().left;
	y = ev.clientY - $("#contenedor").position().top;
}


function ajustaramalla(){
	x = Math.round(x/malla)*malla;
	y = Math.round(y/malla)*malla;
}




//funciones de los botones

function borrartodo(){
		
	circuitlayer.remove();
	textlayer.remove();
	
	circuitlayer = new Kinetic.Layer();
	textlayer = new Kinetic.Layer();
	
	stage.add(circuitlayer);
	stage.add(textlayer);
	
	inicializar();
	inicialiazarmatrices();
	
}



function dibujarcables(){
	tipoelemento = "w";
}

function dibujarresistencias(){
	tipoelemento = "R";
}

function dibujarfuentes(){
	tipoelemento = "V";
}



function mostrarnodos(){

	if(mostrandonodos){
		nodeslayer.remove();
		nodeslayer = "";
		mostrandonodos = false;
	} else {
	
		mostrandonodos = true;
		
		encontrarnodos();
	
		nodeslayer = new Kinetic.Layer();
		var nodosmostrados = [];
		
		for (var j=ymin*2/malla; j<=ymax*2/malla; j+=2){	
			for (var i=xmin*2/malla; i<=xmax*2/malla; i+=2){
			
				var nodotext = matriznodos[i][j];
				
				if (typeof nodotext == "number" && nodosmostrados.indexOf(nodotext) < 0){
					var text = new Kinetic.Text({
						x: i*malla/2+2,
						y: j*malla/2+1,
						text: nodotext,
						fontSize: 15,
						fontFamily: 'calibri',
						fontStyle: 'bold',
						fill: 'darkgreen'
					});
					nodeslayer.add(text);
					nodosmostrados.push(nodotext);
				}
			}
		}
		stage.add(nodeslayer);
	}
}

			
			
// creación de la netlist			
			
function generarnetlist(){

	encontrarnodos();
	
	netlist = [];
	
	everythingfine = true;
	
	for (var i=0; i<elementos.length; i++){
		
		var name = elementos[i].name;
		var value = elementos[i].value;
		
		var nodo1x = elementos[i].x0 * 2/malla;
		var nodo1y = elementos[i].y0 * 2/malla;
		var node1 = nearestnode(nodo1x, nodo1y);
		
		var nodo2x = elementos[i].xf * 2/malla;
		var nodo2y = elementos[i].yf * 2/malla;	
		var node2 = nearestnode(nodo2x, nodo2y)
		
		netlist.push([name, node1, node2, value])
	}
	
	if (!everythingfine){alert("hay algo mal conectado!")};
}



function nearestnode(i, j){

	if (typeof matriznodos[i-1][j] == "number"){
		return matriznodos[i-1][j];
		
	} else if (typeof matriznodos[i+1][j] == "number"){
		return matriznodos[i+1][j];
		
	} else if (typeof matriznodos[i][j-1] == "number"){
		return matriznodos[i][j-1];
		
	} else if (typeof matriznodos[i][j+1] == "number"){
		return matriznodos[i][j+1];
		
	} else {
		everythingfine = false;
	}
}



//función de busqueda de los nodos del circuito

function encontrarnodos(){

	nodetemp = 0;
	node = 0;
	temptoreal = [];


	//duplicar la matriz de malla
	for (var j=ymin*2/malla; j<=ymax*2/malla; j++){	
		for (var i=xmin*2/malla; i<=xmax*2/malla; i++){
			matriznodos[i][j] = matrizcircuito[i][j];
		}
	}
	
	
	for (var j=ymin*2/malla; j<=ymax*2/malla; j++){	
		for (var i=xmin*2/malla; i<=xmax*2/malla; i++){
		
			if( matriznodos[i][j] == "w"){
			
				var vtop = matriznodos[i][j-1];	
				var vleft = matriznodos[i-1][j];
				
				//nueva esquina
				if (vtop=="." && vleft=="."){
					matriznodos[i][j] = nodetemp;
					temptoreal[nodetemp]= nodetemp;
					nodetemp ++;
				}
				
				//continuación de cable horizontal
				if (vtop=="." && typeof vleft == "number"){
					matriznodos[i][j] = vleft;
				}
				
				//continuación de cable vertical
				if (vleft=="." && typeof vtop == "number"){
					matriznodos[i][j] = vtop;
				}
				
				//esquina
				if (typeof vtop == "number" && typeof vleft == "number"){
					
					//continuación de esquina
					if (vtop==vleft){
						matriznodos[i][j] = vtop;
					}
					
					//conflicto de esquina
					else {
						matriznodos[i][j] = nodetemp;
						
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
				if (elemtypes.indexOf(vtop) != -1 || elemtypes.indexOf(vleft) != -1){
				//if (vtop == "#" || vleft == "#"){
					matriznodos[i][j] = nodetemp;
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
	for (var j=ymin*2/malla; j<=ymax*2/malla; j++){	
		for (var i=xmin*2/malla; i<=xmax*2/malla; i++){
			if (typeof matriznodos[i][j] == "number"){
				matriznodos[i][j] = temptoreal[matriznodos[i][j]] ;
			}
		}
	}	
}




function mna(netlist){
	console.info('started -- please be patient.');
	
	nl = $M(eval(netlist));
	
	tic = new Date().getTime();
	
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
	
	say('<b>A</b>='+A.inspect());
	say('<b>X</b>=['+X+']');
	say('<b>Z</b>='+Z.inspect());

	
	if (A.rank() == A.rows()){
		Xsol = A.inv().x(Z);
		
		say('<b>['+X+']</b> = '+Xsol.inspect());
		
		say('solved in '+Math.round( new Date().getTime() - tic ) + 'ms.')
	}else
		throw new Error('A is singular!! A.rank()='+A.rank()+' < A.rows()='+A.rows());

}


//test
function mostrarmatriznodos(){

	encontrarnodos();

	var str = "";
	for (var j=ymin*2/malla; j<=ymax*2/malla; j+=2){	
		for (var i=xmin*2/malla; i<=xmax*2/malla; i+=2){
			(matriznodos[i][j] == ".") ? str += "&nbsp" : str += matriznodos[i][j];
		}
		str += "<br>";
	}
	//console.log(str);
	say(str);	
}


// test
window.addEventListener('keydown', keywindow, false);
function keywindow(e){

	// test - tecla 'r' para rotar elementos mientras se les está arastrando
	if (e.which == 82){
		elemdragged.rotate(Math.PI/2);
		e.preventDefault();
	};

	// test - tecla 'v' para asignar valor 10 a todos los elementos que no tengan valor asignado
	if (e.which == 86){
		for (var i=0; i<elementos.length; i++){
			if (elementos[i].value == "?"){elementos[i].value = "10";}
		}
		console.log("valores asignados");
	};
	
}