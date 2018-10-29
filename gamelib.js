// ============ CALC ============
class Calc {
	constructor(op, args) {
		this.op = op;
		this.args = args;
		if (op == "+") {
			this.v = args.reduce((a, b) => (a + b.v), 0);
		} else if (op == "-") {
			this.v = args[0].v - args[1].v;
		} else if (op == "*") {
			this.v = args.reduce((a, b) => (a * b.v), 1);
		} else if (op == "/") {
			this.v = args[0].v / args[1].v;
		} else if (op == "max") {
			this.v = args.reduce((a, b) => (a > b.v ? a : b.v), 0);
		} else if (op == "sqrt") {
			this.v = Math.sqrt(args[0].v);
		}
	}

	explain() {
		if (this.op == "sqrt") return "√(" + this.explainArg(this.args[0]) + ")";
		else if (this.op == "max") return "max(" + this.args.reduce((a, b) => (a + ", " + this.explainArg(b)), "").slice(2) + ")";
		else return "(" + this.args.reduce((a, b) => (a + " " + this.op.replace("*", "×") + " " + this.explainArg(b)), "").slice(3) + ")";
	}

	explainArg(arg) {
		if (arg.explain != undefined) return arg.explain();
		return Math.round(10000 * (arg.unit.startsWith("%") ? arg.v * 100 : arg.v)) / 10000 + arg.unit + " {" + arg.why + "}";
	}

	static moddedNum(base, mods) {
		let m2 = mods.slice();
		m2.unshift({"v": 1, "unit": "%", "why": "Normal Rate"});
		return new Calc("max", [{"v": 0, "unit": "", "why": "Minimum"}, new Calc("*", [base, new Calc("+", m2)])]);
	}
}

// ============ PRIORITYQUEUE ============
// From https://stackoverflow.com/questions/42919469/efficient-way-to-implement-priority-queue-in-javascript
const parent = i => ((i + 1) >>> 1) - 1;
const left = i => (i << 1) + 1;
const right = i => (i + 1) << 1;
class PriorityQueue {
  constructor(comparator = (a, b) => a > b) {
    this._heap = [];
    this._comparator = comparator;
  }
  size() {
    return this._heap.length;
  }
  isEmpty() {
    return this.size() == 0;
  }
  peek() {
    return this._heap[0];
  }
  push(...values) {
    values.forEach(value => {
      this._heap.push(value);
      this._siftUp();
    });
    return this.size();
  }
  pop() {
    const poppedValue = this.peek();
    const bottom = this.size() - 1;
    if (bottom > 0) {
      this._swap(0, bottom);
    }
    this._heap.pop();
    this._siftDown();
    return poppedValue;
  }
  replace(value) {
    const replacedValue = this.peek();
    this._heap[0] = value;
    this._siftDown();
    return replacedValue;
  }
  _greater(i, j) {
    return this._comparator(this._heap[i], this._heap[j]);
  }
  _swap(i, j) {
    [this._heap[i], this._heap[j]] = [this._heap[j], this._heap[i]];
  }
  _siftUp() {
    let node = this.size() - 1;
    while (node > 0 && this._greater(node, parent(node))) {
      this._swap(node, parent(node));
      node = parent(node);
    }
  }
  _siftDown() {
    let node = 0;
    while (
      (left(node) < this.size() && this._greater(left(node), node)) ||
      (right(node) < this.size() && this._greater(right(node), node))
    ) {
      let maxChild = (right(node) < this.size() && this._greater(right(node), left(node))) ? right(node) : left(node);
      this._swap(node, maxChild);
      node = maxChild;
    }
  }
}
// ============ WORLD ============
class World {
	static calcGlobalIdeology() {
    let ideoW = {};
    for (let r of g_data.regions) {
      if (r.religion == undefined) continue;
      if (!r.religion.startsWith("Iruhan")) continue;
      if (!ideoW.hasOwnProperty(r.religion)) ideoW[r.religion] = 0;
      ideoW[r.religion] += r.population;
    }
    let max = 0;
    let dominantIdeology = undefined;
    for (let i in ideoW) {
      if (!ideoW.hasOwnProperty(i)) continue;
      if (ideoW[i] > max) {
        max = ideoW[i];
        dominantIdeology = i;
      }
    }
		return dominantIdeology;
	}
}

// ============ REGION ============
class Region {
	constructor(id, constEntry, dataEntry, date) {
		this.id =  id;
		this.name = dataEntry.name;
		this.type = dataEntry.type;
		this.path = constEntry.path;
		this.climate = dataEntry.climate;
		this.culture = dataEntry.culture;
		this.population = dataEntry.population;
		this.kingdom = dataEntry.kingdom;
		this.unrest_popular = dataEntry.unrest_popular;
		this.noble = dataEntry.noble;
		this.constructions = dataEntry.constructions;
		this.food = dataEntry.food;
		this.harvest = dataEntry.harvest;
		this.religion = dataEntry.religion;
		this.date = date;
		if (this.noble == undefined) this.noble = {};
	}

	calcRecruitment(extraMod=0) {
		let base = new Calc("*", [
			{"v": this.population, "unit": " citizens", "why": "Regional Population"},
			{"v": 1 / 2000.0, "unit": " recruits / citizen", "why": "Recruitment Rate"}]);
		let mods = [];
		let unrest = this.calcUnrest().v;
		if (unrest > .25) mods.push({"v": .25 - unrest, "unit": "%", "why": "Unrest"});
		if (contains(this.noble.tags, "Inspiring")) mods.push({"v": .5, "unit": "%", "why": "Noble"});
		if (contains(this.noble.tags, "Untrusting")) mods.push({"v": -.35, "unit": "%", "why": "Noble"});
		if (contains(this.noble.tags, "Tyrannical")) mods.push({"v": -.5, "unit": "%", "why": "Noble"});
		if (this.religion == "Northern (Rjinku)") mods.push({"v": 1, "unit": "%", "why": "Worships Rjinku"});
		if (this.religion == "Iruhan (Sword of Truth)") mods.push({"v": 1, "unit": "%", "why": "Sword of Truth ideology"});
		if (this.religion == "Iruhan (Chalice of Compassion)") mods.push({"v": -.3, "unit": "%", "why": "Chalice of Compassion ideology"});
		if (this.religion == "Iruhan (Tapestry of People)") {
			let getTapestryBonus = false;
			for (let r of this.getNeighbors()) if (r.type == "land" && (r.culture != this.culture || r.religion != this.religion)) getTapestryBonus = true;
			if (getTapestryBonus) mods.push({"v": .5, "unit": "%", "why": "Tapestry of People ideology"});
		}
		if (contains(g_data.kingdoms[this.kingdom].tags, "Coast-Dwelling") && this.isCoastal()) mods.push({"v": .12, "unit": "%", "why": "Coast-Dwelling rulers"});
		if (contains(g_data.kingdoms[this.kingdom].tags, "Patriotic")) mods.push({"v": .15, "unit": "%", "why": "Patriotic rulers"});
		if (contains(g_data.kingdoms[this.kingdom].tags, "War-like") && contains(g_data.kingdoms[this.kingdom].core_regions, this.id)) {
			let conquests = 0;
			for (let i = 0; i < g_data.regions.length; i++) if (this.kingdom == g_data.regions[i].kingdom && !contains(g_data.kingdoms[this.kingdom].core_regions, i)) conquests++;
			mods.push({"v": conquests * .05, "unit": "%", "why": "War-like rulers with " + conquests + " conquered regions"});
		}
		let numUniqueIdeologies = g_data.kingdoms[this.kingdom].calcNumUniqueIdeologies();
		if (g_data.kingdoms[this.kingdom].calcStateReligion() == "Iruhan (Tapestry of People)") mods.push({"v": numUniqueIdeologies * .03, "unit": "%", "why": "Tapestry of People state ideology with " + numUniqueIdeologies + " unique ideologies"});
		if (g_data.kingdoms[this.kingdom].calcStateReligion().startsWith("Iruhan") && World.calcGlobalIdeology() == "Iruhan (Tapestry of People)") mods.push({"v": numUniqueIdeologies * .03, "unit": "%", "why": "Tapestry of People global Church ideology with " + numUniqueIdeologies + " unique ideologies"});
		if (extraMod != 0) mods.push({"v": extraMod, "unit": "%", "why": "Hypothetical"});
		return Calc.moddedNum(base, mods);
	}

	calcUnrest() {
		let unrests = [];
		unrests.push({"v": this.unrest_popular, "unit": "% disapproval", "why": "Popular Unrest"});
		if (this.noble.unrest != undefined) {
			unrests.push({"v": this.noble.unrest, "unit": "% disapproval", "why": "Noble Unrest"});
		}
		let wrath = Math.min(1, Math.max(0, -g_data.kingdoms[this.kingdom].goodwill / 100.0));
		if (this.religion == "Iruhan (Sword of Truth)" || this.religion == "Iruhan (Chalice of Compassion)" || this.religion == "Iruhan (Tapestry of People)") {
			unrests.push({"v": wrath, "unit": "% disapproval", "why": "Church Wrath"});
		}
		return new Calc("max", unrests);
	}

	calcTaxation(extraMod=0) {
		let base = new Calc("*", [
			{"v": this.population, "unit": " citizens", "why": "Regional Population"},
			{"v": 1 / 10000.0, "unit": " gold / citizen", "why": "Base Taxation Rate"}]);
		let mods = [];
		let unrest = this.calcUnrest().v;
		if (unrest > .25) mods.push({"v": .25 - unrest, "unit": "%", "why": "Unrest"});
		if (contains(this.noble.tags, "Frugal")) mods.push({"v": .5, "unit": "%", "why": "Noble"});
		if (contains(this.noble.tags, "Hoarding")) mods.push({"v": -.35, "unit": "%", "why": "Noble"});
		if (contains(g_data.kingdoms[this.kingdom].tags, "Coast-Dwelling") && this.isCoastal()) mods.push({"v": .12, "unit": "%", "why": "Coast-Dwelling rulers"});
		if (contains(g_data.kingdoms[this.kingdom].tags, "Mercantile")) mods.push({"v": .15, "unit": "%", "why": "Mercantile rulers"});
		let neighborKuun = false;
		for (let r of this.getNeighbors()) if (r.kingdom != this.kingdom && r.kingdom != undefined && g_data.kingdoms[r.kingdom].calcStateReligion() == "Tavian (River of Kuun)") neighborKuun = true;
		if (neighborKuun) mods.push({"v": 0.5, "unit": "%", "why": "neighbor has River of Kuun state ideology"});
		if (this.religion == "Northern (Syrjen)") mods.push({"v": 1.25, "unit": "%", "why": "Worships Syrjen"});
		if (this.religion == "Iruhan (Tapestry of People)") {
			let getTapestryBonus = false;
			for (let r of this.getNeighbors()) if (r.type == "land" && (r.culture != this.culture || r.religion != this.religion)) getTapestryBonus = true;
			if (getTapestryBonus) mods.push({"v": .5, "unit": "%", "why": "Tapestry of People ideology"});
		}
		if (contains(g_data.kingdoms[this.kingdom].tags, "War-like") && contains(g_data.kingdoms[this.kingdom].core_regions, this.id)) {
			let conquests = 0;
			for (let i = 0; i < g_data.regions.length; i++) if (this.kingdom == g_data.regions[i].kingdom && !contains(g_data.kingdoms[this.kingdom].core_regions, i)) conquests++;
			mods.push({"v": conquests * .05, "unit": "%", "why": "War-like rulers with " + conquests + " conquered regions"});
		}
		let temples = 0;
		for (let c of this.constructions) if (c.type == "temple") temples++;
		if (temples > 0) mods.push({"v": temples * .3, "unit": "%", "why": temples + " temples in region"});
		let numUniqueIdeologies = g_data.kingdoms[this.kingdom].calcNumUniqueIdeologies();
		if (g_data.kingdoms[this.kingdom].calcStateReligion() == "Iruhan (Tapestry of People)") mods.push({"v": numUniqueIdeologies * .03, "unit": "%", "why": "Tapestry of People state ideology with " + numUniqueIdeologies + " unique ideologies"});
		if (g_data.kingdoms[this.kingdom].calcStateReligion().startsWith("Iruhan") && World.calcGlobalIdeology() == "Iruhan (Tapestry of People)") mods.push({"v": numUniqueIdeologies * .03, "unit": "%", "why": "Tapestry of People global Church ideology with " + numUniqueIdeologies + " unique ideologies"});
		if (extraMod != 0) mods.push({"v": extraMod, "unit": "%", "why": "Hypothetical"});
		return Calc.moddedNum(base, mods);
	}

	calcHarvest() {
		let base = new Calc("*", [
			{"v": this.population, "unit": " citizens", "why": "Regional Population"},
			{"v": this.harvest, "unit": " measures / citizen", "why": "Regional Havest Rate"}]);
		let mods = [];
		let unrest = this.calcUnrest().v;
		if (unrest > .5 && !contains(g_data.kingdoms[this.kingdom].tags, "Stoic")) mods.push({"v": .5 - unrest, "unit": "%", "why": "Unrest"});
		if (contains(this.noble.tags, "Meticulous")) mods.push({"v": .15, "unit": "%", "why": "Noble"});
		return Calc.moddedNum(base, mods);
	}

	calcNextHarvest() {
		let base = new Calc("*", [
			{"v": this.population, "unit": " citizens", "why": "Regional Population"},
			{"v": g_data.harvests[(Math.floor((this.date + 1) / 13) + 1) % 4], "unit": " measures / citizen", "why": "Regional Havest Rate"}]);
		let mods = [];
		let unrest = this.calcUnrest().v;
		if (unrest > .5) mods.push({"v": .25 - unrest, "unit": "%", "why": "Unrest"});
		if (contains(this.noble.tags, "Meticulous")) mods.push({"v": .15, "unit": "%", "why": "Noble"});
		return Calc.moddedNum(base, mods);
	}

	calcHarvestWeeks() {
		return new Calc("/", [
			this.calcHarvest(),
			this.calcConsumption()]);
	}

	calcNextHarvestWeeks() {
		return new Calc("/", [
			this.calcNextHarvest(),
			this.calcConsumption()]);
	}

	calcConsumption() {
		let mods = [];
		if (contains(this.noble.tags, "Rationing")) mods.push({"v": -.2, "unit": "%", "why": "Noble"});
		if (contains(this.noble.tags, "Wasteful")) mods.push({"v": .1, "unit": "%", "why": "Noble"});
		if (g_data.kingdoms[this.kingdom].calcStateReligion() == "Iruhan (Chalice of Compassion)") mods.push({"v": -.15, "unit": "%", "why": "Chalice of Compassion state ideology"});
		return Calc.moddedNum(
			new Calc("*", [{"v": this.population, "unit": " citizens", "why": "Regional Population"},
			{"v": 1, "unit": " measures / citizen", "why": "Base Consumption Rate"}]),
			mods);
	}

	calcFoodWeeks() {
		return new Calc("/", [
			{"v": this.food, "unit": " measures of food", "why": "Regional Stockpile"},
			this.calcConsumption()]);
	}

	calcFortification() {
		let forts = 0;
		for (let c of this.constructions) if (c.type == "fortifications") forts ++;
		if (forts == 0) {
			return new Calc("+", [{"v": 1, "unit": "%", "why": "Base Fortification"}]);
		}
		return new Calc("+", [{"v": 1, "unit": "%", "why": "Base Fortification"}, {"v": forts * .15, "unit": "%", "why": "Fortifications (x" + forts + ")"}]);
	}

	calcMinConquestSize(includeUnrest = true) {
		// √(the population of the region) × the region’s fortification multiplier × (100% - the region’s unrest percentage) × 3
		return new Calc("*", [
			new Calc("sqrt", [{"v": this.population, "unit": " citizens", "why": "Regional Population"}]),
			this.calcFortification(),
			includeUnrest
				? new Calc("-", [{"v": 1, "unit": "%", "why": "Base Opposition"}, this.calcUnrest()])
				: {"v": 1, "unit": "%", "why": "Base Opposition"},
			{"v": 3 / 100, "unit": "%", "why": "Base Conquest Factor"}
		]);
	}

	getNeighbors() {
		let n = [];
		for (var b of g_borders) {
			if (b.a == this.id) n.push(g_data.regions[b.b]);
			else if (b.b == this.id) n.push(g_data.regions[b.a]);
		}
		return n;
	}
	
	isCoastal() {
		for (let r of this.getNeighbors()) if (r.type == "water") return true;
		return false;
	}

	getFoodTransferDestinations() {
		let visited = {};
		let n = [];
		let q = this.getNeighbors();
		for (var i of q) {
			visited[i.name] = true;
			if (i.type == "land") n.push(i);
		}
		while (q.length > 0) {
			let i = q[0];
			q = q.slice(1);
			if (i.type == "water") {
				for (var j of i.getNeighbors()) {
					if (!visited.hasOwnProperty(j.name)) {
						visited[j.name] = true;
						q.push(j);
						if (j.type == "land") n.push(j);
					}
				}
			}
		}
		return n;
	}

	calcPlotPowersInRegion() {
		let maxPlotPowers = {};
		for (let k in g_data.kingdoms) {
			if (g_data.kingdoms.hasOwnProperty(k)) {
				maxPlotPowers[k] = 0;
			}
		}
		for (let c of g_data.characters) {
			if (c.location == -1) continue;
			let gp = function(power, loc) {
				let r = g_data.regions[loc];
				if (r.kingdom == undefined) return [power * .95, loc];
				if (g_data.kingdoms[c.kingdom].calcRelationship(g_data.kingdoms[r.kingdom]) == "friendly") {
					if (r.religion == "Northern (Lyskr)") return [power, loc];
					return [power * (1 - r.calcUnrest().v), loc];
				}
				return [power * r.calcUnrest().v, loc];
			}
			let pq = new PriorityQueue((a, b) => (a[0] > b[0]));
			let visited = {};
			pq.push(gp(c.calcPlotPower().v, c.location));
			while (!pq.isEmpty()) {
				let i = pq.pop();
				if (visited[i[1]]) continue;
				visited[i[1]] = true;
				if (i[1] == this.id) {
					if (i[0] > maxPlotPowers[c.kingdom]) maxPlotPowers[c.kingdom] = i[0];
					break;
				}
				for (let b of g_data.regions[i[1]].getNeighbors()) {
					if (!visited[b.id]) pq.push(gp(i[0], b.id));
				}
			}
		}
		return maxPlotPowers;
	}

	calcPirateWeight() {
		if (this.type == "water") return {"v": 0, "unit": " shares", "why": "Sea Region"};
		if (this.religion == "Northern (Alyrja)") return {"v": 0, "unit": " shares", "why": "Follows Alyrja"};
		if (this.noble != undefined && contains(this.noble.tags, "Policing")) return {"v": 0, "unit": "%", "why": "Policing Noble"};
		let base = {"v": this.calcUnrest().v, "unit": " shares", "why": "Unrest"};
		let mods = [];
		if (this.noble.name != undefined) mods.push({"v": -0.5, "unit": "%", "why": "Noble"});
		let bribe = g_data.pirates.bribes[this.kingdom];
		if (bribe != undefined) {
			mods.push({"v": Math.pow(2, bribe / 30) - 1, "unit": "%", "why": "Bribe (" + bribe + " Gold)"});
		}
		return Calc.moddedNum(base, mods);
	}

	calcPirateThreat() {
		let globalWeight = 0;
		for (let r of g_data.regions) globalWeight += r.calcPirateWeight().v;
		return new Calc("/", [this.calcPirateWeight(), {"v": globalWeight, "unit": " shares", "why": "Total Global Shares"}]);
	}


	getBoundingRect() {
		let minx = 9999999;
		let miny = 9999999;
		let maxx = -9999999;
		let maxy = -9999999;
		for (let p of this.path) {
			for (let i of p) {
				if (i[0] > maxx) maxx = i[0];
				if (i[1] > maxy) maxy = i[1];
				if (i[0] < minx) minx = i[0];
				if (i[1] < miny) miny = i[1];
			}
		}
		return [minx, miny, maxx - minx, maxy - miny];
	}

	getRandomPointInRegion(upperRegions, centrality = 0) {
		let rect = this.getBoundingRect();
		rect[0] = rect[0] + centrality * rect[2] / 2;
		rect[1] = rect[1] + centrality * rect[3] / 2;
		rect[2] *= (1 - centrality);
		rect[3] *= (1 - centrality);
		let points = [];
		outer: for (let i = 0; i < 100; i++) {
			let rp = [rect[0] + Math.random() * rect[2], rect[1] + Math.random() * rect[3]];
			if (winding(rp, this.path) == 1) {
				for (let r of upperRegions) {
					if (winding(rp, r.path) == 1) continue outer;
				}
				points.push(rp);
				if (points.length > 3) break;
			}
		}
		if (points.length == 0) return [0, 0];
		let mean = [0, 0];
		for (let p of points) {
			mean[0] += p[0] / points.length;
			mean[1] += p[1] / points.length;
		}
		if (winding(mean, this.path) == 1) return mean;
		return points[0];
	}
}


// ============ KINGDOM ============
class Kingdom {
	constructor(name, dataEntry) {
		this.name = name;
		this.color_bg = dataEntry.color_bg;
		this.color_fg = dataEntry.color_fg;
		this.core_regions = dataEntry.core_regions;
		this.culture = dataEntry.culture;
		this.gold = dataEntry.gold;
		this.gothi = dataEntry.gothi;
		this.relationships = dataEntry.relationships;
		this.tags = dataEntry.tags;
		this.goodwill = dataEntry.goodwill;
		this.loyal_to_cult = dataEntry.loyal_to_cult;
		this.court = dataEntry.court;
		this.taxratehint = dataEntry.taxratehint;
		this.signingbonushint = dataEntry.signingbonushint;
		this.score = dataEntry.score;
	}

	calcRecruitment(extraMod=0) {
		let parts = [];
		for (let r of g_data.regions) {
			if (r.kingdom == this.name) parts.push({"v": r.calcRecruitment(extraMod).v, "unit": " soldiers", "why": r.name});
		}
		return new Calc("+", parts);
	}

	calcTaxation(extraMod=0) {
		let parts = [];
		for (let r of g_data.regions) {
			if (r.kingdom == this.name) parts.push({"v": r.calcTaxation(extraMod).v, "unit": " gold", "why": r.name});
		}
		return new Calc("+", parts);
	}

	calcRelationship(kingdom) {
		if (kingdom == this) return "friendly";
		let out = this.relationships[kingdom.name].battle;
		let inc = kingdom.relationships[this.name].battle;
		if (out == "ATTACK" || inc == "ATTACK") return "enemy";
		if (inc == "DEFEND" && out == "DEFEND") return "friendly";
		return "neutral";
	}

	calcFoodWeeks() {
		let partsFood = [];
		let partsConsumption = [];
		for (let r of g_data.regions) {
			if (r.kingdom != this.name) continue;
			partsFood.push({"v": r.food, "unit": " measures", "why": r.name});
			partsConsumption.push({"v": r.calcConsumption().v, "unit": " measures / week", "why": r.name});
		}
		return new Calc("/", [new Calc("+", partsFood), new Calc("+", partsConsumption)]);
	}

	calcPopulation() {
		let parts = [];
		for (let r of g_data.regions) {
			if (r.kingdom == this.name) parts.push({"v": r.population, "unit": " citizens", "why": r.name});
		}
		return new Calc("+", parts);
	}

	calcStateReligionWeights() {
		let weights = {};
		for (let r of g_data.regions) {
			if (r.kingdom != this.name) continue;
			if (!weights.hasOwnProperty(r.religion)) weights[r.religion] = 0;
			weights[r.religion] += r.population * (r.noble != undefined && contains(r.noble.tags, "Pious") ? 3 : 1);
		}
		return weights;
	}

	calcStateReligion() {
		let weights = this.calcStateReligionWeights();
		let max = "";
		for (let w in weights) {
			if (!weights.hasOwnProperty(w)) continue;
			if (max == "" || weights[w] > weights[max]) max = w;
		}
		return max;
	}

	calcNumUniqueIdeologies() {
		let m = {};
		for (let r of g_data.regions) {
			if (r.kingdom != this.name) continue;
			m[r.religion] = true;
		}
		let c = 0;
		for (let k in m) if (m.hasOwnProperty(k)) c++;
		return c;
	}

	calcPirateThreat() {
		let totalweight = 0;
		let mods = [];
		for (let r of g_data.regions) {
			let w = r.calcPirateWeight().v;
			totalweight += w;
			if (r.kingdom == this.name) mods.push({"v": w, "unit": " shares", "why": r.name});
		}
		return new Calc("/", [new Calc("+", mods), {"v": totalweight, "unit": " shares", "why": "Global Total Weight"}]);
	}

	getRuler() {
		for (let c of g_data.characters) {
			if (c.kingdom == this.name && contains(c.tags, "Ruler")) return c;
		}
		return undefined;
	}

	calcGothiVotes() {
		let votes = {
			"Alyrja": {"v": 0, "total": 0},
			"Rjinku": {"v": 0, "total": 0},
			"Lyskr": {"v": 0, "total": 0},
			"Syrjen": {"v": 0, "total": 0},
		};
		for (let c of g_data.regions) {
			if (c.religion != undefined && c.religion.startsWith("Northern")) {
				let ideology = c.religion.substring(c.religion.indexOf("(") + 1, c.religion.indexOf(")"));
				if (c.kingdom == this.name) votes[ideology].v++;
				votes[ideology].total++;
			}
		}
		return votes;
	}
}


// ============ CHARACTER ============
class Character {
	constructor(dataEntry) {
		this.name = dataEntry.name;
		this.honorific = dataEntry.honorific;
		this.kingdom = dataEntry.kingdom;
		this.captor = dataEntry.captor;
		this.location = dataEntry.location;
		this.preparation = dataEntry.preparation;
		this.tags = dataEntry.tags;
		this.experience = dataEntry.experience;
		this.orderhint = dataEntry.orderhint;
		this.values = dataEntry.values;
	}

	calcLevel(dimension) {
		if (this.experience[dimension] >= 24) return 5;
		if (this.experience[dimension] >= 15) return 4;
		if (this.experience[dimension] >= 8) return 3;
		if (this.experience[dimension] >= 3) return 2;
		return 1;
	}

	calcPlotPower() {
		let mods = [];
		mods.push({"v": 0.3 * this.calcLevel("spy"), "unit": "%", "why": "Experience"});
		if (g_data.kingdoms[this.kingdom].calcStateReligion() == "Northern (Lyskr)") mods.push({"v": 1, "unit": "%", "why": "State Ideology (Lyskr)"});
		return Calc.moddedNum({"v": 1, "unit": "power", "why": "Base Plot Power"}, mods);
	}
}


// ============ ARMY ============
class Army {
	constructor(dataEntry) {
		this.id = dataEntry.id;
		this.type = dataEntry.type;
		this.size = dataEntry.size;
		this.kingdom = dataEntry.kingdom;
		this.location = dataEntry.location;
		this.preparation = dataEntry.preparation;
		this.tags = dataEntry.tags;
		this.orderhint = dataEntry.orderhint
	}

	calcStrength() {
		let base = this.type == "army"
				? new Calc("*", [{"v": this.size, "unit": " soldiers", "why": "Army Size"}, {"v": 1/100.0, "unit": " strength per soldier", "why": "Base Strength Rate"}])
				: new Calc("*", [{"v": this.size, "unit": " warships", "why": "Navy Size"}, {"v": 1, "unit": " strength per warship", "why": "Base Strength Rate"}]);
		let mods = [];
		let r = g_data.regions[this.location];
		let k = g_data.kingdoms[this.kingdom];
		let religion = k != undefined ? k.calcStateReligion() : "";
		if (contains(this.tags, "Steel")) mods.push({"v": .15, "unit": "%", "why": "Steel"});
		if (contains(this.tags, "Seafaring") && r.type == "water") mods.push({"v": 1.5, "unit": "%", "why": "Seafaring in Sea Region"});
		if (this.type == "army" && k != undefined && contains(k.tags, "Disciplined")) mods.push({"v": .1, "unit": "%", "why": "Disciplined Nation"});
		if (this.type == "army" && r.kingdom != undefined && k != undefined && k.calcRelationship(g_data.kingdoms[r.kingdom]) == "friendly") {
			let fort = r.calcFortification().v;
			if (fort > 1 && this.type == "army") {
				mods.push({"v": fort - 1, "unit": "%", "why": "Fortifications"});
			}
		}
		if (this.type == "army" && r.noble != undefined && r.noble.tags != undefined && contains(r.noble.tags, "Loyal") && r.kingdom == this.kingdom) mods.push({"v": .25, "unit": "%", "why": "Loyal noble"});
		if (this.type == "army" && World.calcGlobalIdeology() == "Iruhan (Sword of Truth)") {
			let state = k.calcStateReligion();
			if (state == "Iruhan (Sword of Truth)") mods.push({"v": .25, "unit": "%", "why": "Iruhan (Sword of Truth) global ideology matches state ideology"});
			else if (state.startsWith("Iruhan")) mods.push({"v": .15, "unit": "%", "why": "Iruhan (Sword of Truth) global ideology and Iruhan state religion"});
		}
		return Calc.moddedNum(base, mods);
	}
}
