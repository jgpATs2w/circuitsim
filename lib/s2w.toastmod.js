if(!s2w) var s2w = {};
if(!s2w.log && typeof S2W_Log != "undefined") s2w.log = new S2W_Log();
function S2W_Toast(){
	this._divId = "s2w_toast_div";
	
	this._timeout = 2000;
	
	if((this._div = document.getElementById(this._divId)) == null){
		div = document.createElement('div');
		div.id = this._divId;
		document.body.appendChild(div);
	}
	
}
/**
 * @param {String} divId Id of the div element to show up the Toast, by default 's2w_toast_div'
 */
S2W_Toast.prototype.setDivId = function(divId){
	this._divId = divId;
}
/**
 * @param {number} milis Miliseconds to wait before hide automatically
 */
S2W_Toast.prototype.setTimeOut = function(milis){
	this._timeout = milis;
}
/**
 * Shows up the message in to the internal div.
 * @param {String} message
 * @param {boolean} [permanent] if true, the toast must be hidden using the method hide()
 */
S2W_Toast.prototype.show = function(message, permanent){//s2w.log.info(this, 'showing toast '+message);
	div = document.getElementById(this._divId);
		div.innerHTML = message;
		div.style.display = "block";
	
	if(permanent) return;
	
	setTimeout(function(){
		div.innerHTML = '';
		div.style.display = "none";}, this._timeout);
}
S2W_Toast.prototype.hide = function(){
	document.getElementById(s2w.Toast._divId).style.display = "none";
}

S2W_Toast.prototype.toString = function(){return "[object S2W_Toast]"}

window.addEventListener('load', function(){
	s2w.Toast = new S2W_Toast();
});
