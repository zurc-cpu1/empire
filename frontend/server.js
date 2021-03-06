function getArg(p) {
	var t = window.location.search;
	var s = t.indexOf(p + "=");
	if (s == -1) return undefined;
	var e = t.indexOf("&", s);
	if (e == -1) e = t.length;
	return decodeURI(t.substring(s + p.length + 1, e));
}

let g_server = "";
if (getArg("server") == "local") {
	g_server = "http://localhost:8080";
} else if (getArg("server") == "prod") {
	g_server = "https://empire-189013.appspot.com";
} else if (window.location.protocol == "file:") {
	g_server = "http://localhost:8080";
} else {
	g_server = "https://empire-189013.appspot.com";
}

function addAuth(req, user, password) {
	req.setRequestHeader("Authorization", "Basic " + btoa(user + ":" + password));
}

function loadFromStorage(key) {
	let val = localStorage.getItem(key);
	if (val == null) val = sessionStorage.getItem(key);
	return val;
}

let g_player = loadFromStorage("g_player");
let g_password = loadFromStorage("g_password");
