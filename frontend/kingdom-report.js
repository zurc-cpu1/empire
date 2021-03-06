// <kingdom-report>
// Attributes:
//   name      - the name of the kingdom

class KingdomReport extends HTMLElement {
	constructor() { super(); }
	connectedCallback() {
		let kname = this.getAttribute("kingdom");
		let kingdom = undefined;
		for (var k in g_data.kingdoms) {
			if (k == kname) kingdom = g_data.kingdoms[k];
		}
		let shadow = this.attachShadow({mode: "open"});

		let stateReligion = kingdom.calcStateReligion();
		let stateReligionShares = kingdom.calcStateReligionWeights();
		let stateReligionSharesText = [];
		for (let r in stateReligionShares) {
			if (!stateReligionShares.hasOwnProperty(r)) continue;
			stateReligionSharesText.push(r + ": " + Math.round(stateReligionShares[r]) + " souls");
		}
		let stateReligionTooltip = "State religion is the most popular religion and ideology among the regions ruled by a nation. " + kingdom.name + " rules: " + stateReligionSharesText.join(", ") + ". ";
		stateReligionTooltip += {
			"Iruhan (Sword of Truth)": "As a consequence of their widespread devotion to the Sword of Truth ideology, the armies and navies of " + kingdom.name + " are stronger.",
			"Iruhan (Vessel of Faith)": "As a consequence of their widespread devotion to the Vessel of Faith ideology, the people of " + kingdom.name + " can oversee construction in regions that would normally be forbidden.",
			"Iruhan (Chalice of Compassion)": "As a consequence of their widespread devotion to the Chalice of Compassion ideology, the people of " + kingdom.name + " are willing to subsidize the transfers of food.",
			"Iruhan (Tapestry of People)": "As a consequence of their widespread devotion to the Tapestry of Peoples ideology, the soldiers of " + kingdom.name + " are stronger for every unique temple in the nation.",
			"Northern (Alyrja)": "As a consequence of their widespread devotion to Alyrja, the people of " + kingdom.name + " are more accepting of limited rations.",
			"Northern (Rjinku)": "As a consequence of their widespread devotion to Rjinku, the people of " + kingdom.name + " make excellent generals.",
			"Northern (Lyskr)": "As a consequence of their widespread devotion to Lyskr, the people of " + kingdom.name + " can establish spy rings more easily.",
			"Northern (Syrjen)": "As a consequence of their widespread devotion to Syrjen, the people of " + kingdom.name + " are skilled traders and profit more from dominance in sea regions.",
			"Tavian (Flame of Kith)": "As a consequence of their widespread adoption of the Flame of Kith, the people of " + kingdom.name + " make excellent governors.",
			"Tavian (River of Kuun)": "As a consequence of their widespread adoption of the River of Kuun, the people of " + kingdom.name + " generate wealth by trade and tribute.",
			"Company": "This nation does not rule any territory, and focuses on efficiency, lowering the cost of their armies and navies.",
		}[stateReligion];
		let html = `
			<div id="abspos">
				<div>${kingdom.name}</div>
				<div id="summary">
					<div>${kingdom.tags[0]}</div><div>${kingdom.tags[1]}</div>
					<div>${num(kingdom.calcPopulation(), 0, 1/1000)}k</div><div>citizens</div>
					<div>${num(kingdom.calcTaxation())}</div><div>tax</div>
					<div>${num(kingdom.calcFoodWeeks(), 1)}</div><div>weeks food</div>
					<div>${num(kingdom.calcRecruitment())}</div><div>recruits</div>
					<div>
						<tooltip-element tooltip="${stateReligionTooltip}">${stateReligion}</tooltip>
						${kingdom.loyal_to_cult ? " - <tooltip-element tooltip=\"This nation has cut a deal with the dangerous Cult of the Witness, acquiring command of undead armies in exchange for furthering the unknown and mysterious agenda of the Cult. If nations that have declared loyalty to the Cult conquer sufficient territory or if the undead occupy a sufficient number of regions over the course of the game, the Cult will trigger an event of apocalyptic proportions!\">Cultist</tooltip-element>" : ""}
					</div>
				</div>
				${kingdom.gold != -1 ? "<h1>Treasury: " + (Math.round(10 * kingdom.gold) / 10) + " gold</h1>" : ""}
				<h1 id="heading_notifications">Notifications</h1>
				<div id="notifications"></div>
				<h1>Past Correspondence</h1>
				<div id="letters"></div>
				<h1>Characters</h1>
				<div id="characters"></div>
				<h1>Regions</h1>
				<div id="regions"></div>
				<h1 id="heading_historical">Unowned Historical Regions</h1>
				<div id="historical"></div>
				<h1 id="heading_score">Score</h1>
				<div id="score"></div>
			</div>
		`;
		// CSS
		let style = document.createElement("style");
		style.innerHTML = `
			:host {
				height: 100%;
				overflow: auto;
				box-shadow: 1em 0 1em rgba(0, 0, 50, .2);
				background-color: #fff;
			}
			#abspos {
				position: relative;
			}
			#abspos > div:first-child {		
				background: url(${"images/" + kingdom.name.toLowerCase() + "_strip.jpg"}) no-repeat center center;
				background-size: cover;
				padding-top: .2em;
				padding-bottom: .2em;
				font-size: 200%;
				color: #fff;
				text-shadow: 0 0 6px #000, 0 0 0 #000, 0 0 3px #000, 1px 1px 3px #000, -1px -1px 3px #000;
				text-align: center;
			}
			#abspos > div:nth-child(n+3) {
				margin-left: 0.3em;
				margin-right: 0.3em;
			}
			#summary {
				display: grid;
				grid-template-columns: 1fr 2fr 1fr 2fr;
				margin-top: 0.5em;
				margin-bottom: 0.5em;
				font-family: sans-serif;
			}
			#summary div:nth-child(odd) {
				text-align: right;
				padding-right: 0.5em;
			}
			#summary div:nth-child(n + 11) {
				text-align: center;
			  grid-column-start: 1;
			  grid-column-end: 5;
				margin-top: 0.7em;
			}
			#summary div:nth-child(1) {
				text-align: center;
				grid-column-start: 1;
				grid-column-end: 3;
				margin-bottom: 0.7em;
			}
			#summary div:nth-child(2) {
				text-align: center;
				grid-column-start: 3;
				grid-column-end: 5;
				margin-bottom: 0.7em;
			}
			#relationships {
				margin-left: 0.3em;
				margin-right: 0.3em;
			}
			#relationships .war {
				color: #c00;
			}
			#relationships .war_indirect {
				color: #700;
			}
			#relationships .openborders {
				color: #007;
			}
			#relationships .ally {
				color: #00f;
			}
			#characters .snippet {
				margin-left: 0.7em;
				color: #777;
				font-size: 75%;
				line-height: 0.9;
			}
			.historical {
				font-weight: bold;
			}
			h1 {
				margin-top: 0.7em;
				margin-bottom: 0;
				margin-left: 0;
				font-size: 100%;
				font-weight: bold;
				font-family: sans-serif;
			}
			h2 {
				margin-top: 0.3em;
				margin-bottom: 0;
				margin-left: 0;
				font-size: 90%;
				font-weight: bold;
				font-family: sans-serif;
			}
			table {
				width: 100%;
			}
			tr td:nth-child(2), tr th:nth-child(2) {
				text-align: right;
			}
			.replylink {
				cursor: pointer;
				font-size: 70%;
				font-family: sans-serif;
				font-variant: small-caps;
				font-color: #00f;
				margin-left: 1em;
			}
			`;
		shadow.appendChild(style);
		let div = document.createElement("div");
		div.innerHTML = html;
		shadow.appendChild(div);

		let charDiv = shadow.getElementById("characters");
		let characters = [];
		for (let c of g_data.characters) {
			if (c.kingdom == kingdom.name) characters.push(c);
		}
		characters.sort((a, b)=>(a.name > b.name ? 1 : a.name < b.name ? -1 : 0));
		for (let c of characters) {
			let cDiv = document.createElement("div");
			let d = document.createElement("report-link");
			d.setAttribute("href", "character/" + c.name);
			d.innerHTML = c.name;
			cDiv.appendChild(d);
			if (c.tags.length > 0) cDiv.appendChild(document.createTextNode(" (" + c.tags.join(", ") + ")"));
			charDiv.appendChild(cDiv);
		}

		// Add letters.
		let letDiv = shadow.getElementById("letters");
		let comms = [];
		for (let l of g_data.communications) comms.push(l);
		comms.sort(function(a, b){
			let ddiff = b.post_date - a.post_date;
			if (ddiff != 0) return ddiff;
			let afrom = contains(a.to, kingdom.name);
			let bfrom = contains(b.to, kingdom.name);
			if (afrom && !bfrom) return -1;
			else if (!afrom && bfrom) return 1;
			return 0;
		});
		let last_date = -1;
		let sent = null;
		for (let l of comms) {
			let from = l.signed.replace(/.* /, "");
			if (l.post_date != last_date) {
				let h2 = document.createElement("h2");
				h2.appendChild(document.createTextNode("Week " + l.post_date));
				letDiv.appendChild(h2);
				last_date = l.post_date;
			}
			let lt = document.createElement("div");
			let line = from + " to " + l.to.join(", ");
			if (!contains(l.to, kingdom.name) && from != kingdom.name) continue;
			if (kingdom.name == whoami) {
				if (from == whoami) line = "to " + l.to.join(", ");
				else if (l.to.length == 1 && l.to[0] == whoami) line = "from " + from;
			}
			lt.appendChild(document.createTextNode((from == kingdom.name ? "→" : "←") + " " + line));
			if (kingdom.name == whoami && from != "Anonymous") {
				let reply = document.createElement("span");
				reply.setAttribute("class", "replylink");
				reply.appendChild(document.createTextNode("reply"));
				let group = [];
				for (let r of l.to) if (r != whoami) group.push(r);
				if (from != whoami) group.push(from);
				reply.addEventListener("click", () => document.querySelector("orders-pane").startLetter(group));
				lt.appendChild(reply);
			}
			let snippet = document.createElement("expandable-snippet");
			snippet.setAttribute("text", l.text.replace(/</g, "&lt").replace(/>/g, "&gt") + "\n\n" + l.signed);
			snippet.setAttribute("max-length", 64);
			lt.appendChild(snippet);
			letDiv.appendChild(lt);
		}

		// Add regions.
		let regions = [];
		for (let r of g_data.regions) {
			if (r.kingdom == kingdom.name) regions.push(r);
		}
		let table = document.createElement("table");
		let hr = document.createElement("tr");
		hr.appendChild(document.createElement("th"));
		let th = document.createElement("th");
		let sel = document.createElement("select");
		let opts = {
			"Food (Weeks)": (r)=>(Math.round(r.calcFoodWeeks().v * 10) / 10),
			"Population": (r)=>(Math.round(r.population)),
			"Recruitment": (r)=>(Math.round(r.calcRecruitment().v)),
			"Taxation": (r)=>(Math.round(r.calcTaxation().v)),
			"Unrest": (r)=>(Math.round(r.calcUnrest().v * 100)),
		};
		for (let opt in opts) {
			let optE = document.createElement("option");
			optE.innerHTML = opt;
			sel.appendChild(optE);
		}
		th.appendChild(sel);
		hr.appendChild(th);
		table.appendChild(hr);
		let tbody = document.createElement("tbody");
		table.appendChild(tbody);
		let setRegions = function () {
			let rvalues = [];
			for (let r of regions) rvalues.push({"r": r.name, "v": opts[sel.value](r), "id": r.id});
			rvalues.sort((a, b)=>(b.v - a.v));
			tbody.innerHTML = "";
			for (let r of rvalues) {
				let row = document.createElement("tr");
				let tda = document.createElement("td");
				if (kingdom.core_regions.includes(r.id)) tda.setAttribute("class", "historical");
				let rlink = document.createElement("report-link");
				rlink.innerHTML = r.r;
				rlink.setAttribute("href", "region/" + r.r);
				tda.appendChild(rlink);
				let tdb = document.createElement("td");
				tdb.innerHTML = r.v;
				row.appendChild(tda);
				row.appendChild(tdb);
				tbody.appendChild(row);
			}
		}
		sel.addEventListener("change", setRegions);
		setRegions();
		shadow.getElementById("regions").appendChild(table);

		// Add notifications.
		let notes = shadow.getElementById("notifications");
		let nList = [];
		for (let n of g_data.notifications) if (n.who == kingdom.name) nList.push(n);
		if (nList.length == 0) {
			notes.style.display = "none";
			shadow.getElementById("heading_notifications").style.display = "none";
		} else {
			for (let n of nList) {
				let lt = document.createElement("div");
				lt.appendChild(document.createTextNode(n.title));
				let snippet = document.createElement("expandable-snippet");
				snippet.setAttribute("text", n.text);
				snippet.setAttribute("max-length", 64);
				lt.appendChild(snippet);
				notes.appendChild(lt);
			}
		}
		{
			let unownedHistorical = false;
			for (let ri of kingdom.core_regions) {
				let r = g_data.regions[ri];
				if (r.kingdom == kname) continue;
				unownedHistorical = true;
				let d = document.createElement("div");
				let rl = document.createElement("report-link");
				rl.setAttribute("href", "region/" + r.name);
				rl.innerHTML = r.name;
				d.appendChild(rl);
				if (r.kingdom != kingdom.name) {
					rl = document.createElement("report-link");
					rl.setAttribute("href", "kingdom/" + r.kingdom);
					rl.innerHTML = r.kingdom;
					d.appendChild(document.createTextNode(" (Controlled by "));
					d.appendChild(rl);
					d.appendChild(document.createTextNode(")"));
				}
				shadow.getElementById("historical").appendChild(d);
			}
			if (!unownedHistorical) {
				shadow.getElementById("heading_historical").style.display = "none";
			}
		}
		if ("(Observer)" == whoami) {
			let score = shadow.getElementById("score");
			let d = document.createElement("div");
			d.innerHTML = "They care about " + kingdom.profiles.map(s => s.toLowerCase()).sort().join(", ") + ".";
			score.appendChild(d);
			if (kingdom.score != undefined) {
				for (let s in kingdom.score) if (kingdom.score.hasOwnProperty(s)) {
					let d = document.createElement("div");
					d.innerHTML = s.substring(0, 1).toUpperCase() + s.substring(1) + ": " + (kingdom.score[s] > 0 ? "+" : "") + Math.round(kingdom.score[s] * 10) / 10;
					score.appendChild(d);
				}
			}
		} else {
			shadow.getElementById("heading_score").style.display = "none";
		}
	}
}
customElements.define("kingdom-report", KingdomReport);

let contains = function(ar, val) {
	if (ar == undefined) return false;
	for (a of ar) {
		if (a == val) return true;
	}
	return false;
}
