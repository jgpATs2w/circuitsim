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
	tipoelemento = "w";

	malla = 12;
	matrizcircuito = [];
	matriznodos = [];
	
	elementos = [];
	netlist = [];
	
	numelemarray = [];
	numelemarray["R"] = 0;
	numelemarray["V"] = 0;
	numelemtotal = 0;

	xmin = 10000;
	ymin = 10000;
	xmax = 0;
	ymax = 0;
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
textlayer = new Kinetic.Layer();
nodeslayer = "";

stage.add(backgroundlayer);
stage.add(circuitlayer);
stage.add(panellayer);
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
			fill: "grey",
		});
		
		backgroundlayer.add(rect);
	}
}
backgroundlayer.draw();




// inicialización de matrices
inicialiazarmatrices();

function inicialiazarmatrices(){
	for (var i=0; i<anchura*2/malla; i++){
		matrizcircuito[i] = [];
		//matriznodos[i] = [];
		for (var j=0; j<altura*2/malla; j++){		
			matrizcircuito[i][j] = ".";
			//matriznodos[i][j] = ".";
		}
	}
}




//dibujado

function mousedown(ev){
	
	if (textclick){return;}
	
	getcoordinates(ev);	
	ajustaramalla();
	
	drawing = true;
	dir = "";
	
	x0 = x;
	y0 = y;
	x1 = x;
	y1 = y;
	
	if (tipoelemento == "w"){color = "black";}//
	if (tipoelemento == "R"){color = "red";}//
	if (tipoelemento == "V"){color = "limegreen";}//
	
	drawinglayer = new Kinetic.Layer();
	
	templine = new Kinetic.Line({
		points: [x0, y0, x0, y0],
        stroke: color,
        strokeWidth: 4,
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
				addelement(x0, y0, x1, y1);
			}
			
			addtomatrix(x0, y0, x1, y1);
			addtomatrix(x1, y1, x2, y2);
		
		}

		drawing = false;
		drawinglayer.remove();			
	}
}



// añadir elementos dibujados a la matriz del circuito

function addtomatrix(x0, y0, xf, yf){

	for (var i=Math.min(x0,xf)*2/malla; i<=Math.max(x0,xf)*2/malla; i++){
		for (var j=Math.min(y0,yf)*2/malla; j<=Math.max(y0,yf)*2/malla; j++){
			matrizcircuito[i][j] = tipoelemento;
		}
	}
	
	xmin = Math.min(xmin, x0, xf);
	ymin = Math.min(ymin, y0, yf);
	xmax = Math.max(xmax, x0, xf);
	ymax = Math.max(ymax, y0, yf);
}


function addelement(x0, y0, xf, yf){
	
	numelemtotal++;
	numelemarray[tipoelemento]++;
	
	var name = tipoelemento + numelemarray[tipoelemento];
	
	elementos.push({name: name, x0: x0, y0: y0, xf: xf, yf:yf, value: "?"});

	//añadir la etiqueta con el nombre de los elementos
	if (x0==xf){
		tx = x0 - 15;
		ty = (y0 + yf)/2;
	} else {
		tx = (x0 + xf)/2;
		ty = y0 - 10;
	}
	
	var text = new Kinetic.Text({
		x: tx-15,
		y: ty-12,
		text:  name,
		fontSize: 22,
		fontFamily: 'calibri',
		fill: 'black',
		name: name,
		draggable: true
	});
	
	text.setAttr("elemval", "");
	
	text.on("mousedown", function(){
		textclick = true;
		//this.setText(this.getAttr("name") + " = ");
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
	
}


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
	
	$("#netlist").html("");
	
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

	if(nodeslayer != ""){
		nodeslayer.remove();
		nodeslayer = "";
	} else {
	
		encontrarnodos();
	
		nodeslayer = new Kinetic.Layer();
		var alr = [".", "#"];
		
		for (var j=ymin*2/malla; j<=ymax*2/malla; j+=2){	
			for (var i=xmin*2/malla; i<=xmax*2/malla; i+=2){
			
				var nodotext = matriznodos[i][j];
				
				if (alr.indexOf(nodotext) < 0){
					var text = new Kinetic.Text({
						x: i*malla/2+2,
						y: j*malla/2+1,
						text: nodotext,
						fontSize: 15,
						fontFamily: 'calibri',
						fill: 'blue'
					});
					nodeslayer.add(text);
					alr.push(nodotext);
				}
			}
		}
	  stage.add(nodeslayer);
	 }
}

			
			
function generarnetlist(){

	encontrarnodos();
	
	netlist = [];
	
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
}



function nearestnode(i, j){//errores de aproximación

	if (matriznodos[i-1][j] != "#" && matriznodos[i-1][j] != "."){
		return matriznodos[i-1][j];
		
	} else if (matriznodos[i+1][j] != "#" && matriznodos[i+1][j] != "."){
		return matriznodos[i+1][j];
		
	} else if (matriznodos[i][j-1] != "#" && matriznodos[i][j-1] != "."){
		return matriznodos[i][j-1];
		
	} else if (matriznodos[i][j+1] != "#" && matriznodos[i][j+1] != "."){
		return matriznodos[i][j+1];
		
	} else {
		alert("hay elementos mal posicionados en "+i+","+j);
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
			matriznodos[i] = [];
			(matrizcircuito[i][j] == "w" || matrizcircuito[i][j] == ".") ? elem = matrizcircuito[i][j] : elem = "#";
			matriznodos[i][j] = elem;
		}
	}
	
	
	for (var j=ymin*2/malla; j<=ymax*2/malla; j++){	
		for (var i=xmin*2/malla; i<=xmax*2/malla; i++){
		
			var vd = matriznodos[i][j];
			
			if (vd == "w"){
			
				var va = matriznodos[i-1][j-1];
				var vb = matriznodos[i][j-1];	
				var vc = matriznodos[i-1][j];
				
				//nueva esquina
				if (vb=="." && vc=="."){
					matriznodos[i][j] = nodetemp;
					temptoreal[nodetemp]= nodetemp;
					nodetemp ++;
				}
				
				//continuación de cable horizontal
				if (vb=="." && vc!="." && vc!="#"){
					matriznodos[i][j] = vc;
				}
				
				//continuación de cable vertical
				if (vc=="." && vb!="." && vb!="#"){
					matriznodos[i][j] = vb;
				}
				
				//esquina
				if (vb!="." && vb!="#" && vc!="." && vc!="#"){
					
					//continuación de esquina
					if (vb==vc){
						matriznodos[i][j] = vb;
					}
					
					//conflicto de esquina
					else {
						matriznodos[i][j] = nodetemp;
						
						for (var k=0; k<nodetemp; k++){
							if (k!=vb && k!=vc && (temptoreal[k]==temptoreal[vb] || temptoreal[k]==temptoreal[vc])){
								temptoreal[k]=nodetemp;
							}
						}
						
						temptoreal[nodetemp]=nodetemp;
						temptoreal[vb]=nodetemp;
						temptoreal[vc]=nodetemp;
						nodetemp++;
					}
				}
				
				//final de elemento
				if (vb=="#" || vc=="#"){
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
	
	
	//matriz de nodos final
	for (var j=ymin*2/malla; j<=ymax*2/malla; j++){	
		for (var i=xmin*2/malla; i<=xmax*2/malla; i++){
			if (matriznodos[i][j]!= "." && matriznodos[i][j]!= "#"){
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
		
		//If node 1 is connected to ground, add element to diagonal of matrix
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
		V[i] = 'v_'+i;
	
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