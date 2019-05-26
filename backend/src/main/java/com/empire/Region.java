package com.empire;

import com.google.gson.annotations.SerializedName;

import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.Deque;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.PriorityQueue;
import java.util.Set;
import java.util.function.Function;

class Region {
	enum Type {
		@SerializedName("land")
		LAND,
		@SerializedName("water")
		WATER
	}

	String name;
	Type type;
	Culture culture;
	String climate;
	double population;
	Ideology religion;
	double unrestPopular;
	Noble noble;
	List<Construction> constructions = new ArrayList<>();
	double food;
	double harvest;
	boolean gotCultFood;

	private String kingdom;

	//TODO: does this method belong with kingdom/nation?
	static int numUniqueIdeologies(String kingdom, World w) {
		return (int) w.regions.stream()
				.filter(r -> kingdom.equals(r.getKingdom()))
				.map(r -> r.religion)
				.distinct().count();
	}

	public boolean canFoodTransferTo(World w, Region target) {
		Set<Region> legals = new HashSet<>();
		legals.add(this);
		Deque<Region> stack = new ArrayDeque<>();
		stack.push(this);

		for (Region n : getNeighbors(w)) {
			if (n.isSea()) stack.push(n);
			legals.add(n);
		}

		while (!stack.isEmpty()) {
			Region r = stack.pop();
			for (Region n : r.getNeighbors(w)) {
				if (n.isSea() && !legals.contains(n)) stack.push(n);
				legals.add(n);
			}
		}

		return legals.contains(target);
	}

	// TODO - the function this method provides looks like it should reside in the Culture enum class
	public List<String> getArmyTags() {
		List<String> t = new ArrayList<>();
		switch (culture) {
			case ANPILAYN:
				t.add(Constants.armySteelTag);
				t.add(Constants.armyFormationsTag);
				break;
			case EOLSUNG:
				t.add(Constants.armyPillagersTag);
				t.add(Constants.armyRaidersTag);
				break;
			case HANSA:
				t.add(Constants.armySeafaringTag);
				t.add(Constants.armyImpressmentTag);
				break;
			case TYRGAETAN:
				t.add(Constants.armyWeatheredTag);
				t.add(Constants.armyPathfindersTag);
				break;
			case TAVIAN:
				t.add(Constants.armyRidersTag);
				t.add(Constants.armyCraftsSoldiersTag);
				break;
		}
		return t;
	}

	public double calcRecruitment(World w, List<Character> governors, double signingBonus, boolean rulerBattled, double rationing, Army largestInRegion) {
		double base = population * Constants.recruitmentPerPop;
		double unrest = calcUnrest(w);
		if (unrest > Constants.unrestRecruitmentEffectThresh) base *= 1.0 - (unrest - Constants.unrestRecruitmentEffectThresh);

		double mods = 1;
		mods += calcSigningBonusMod(signingBonus);

		if (governors != null) {
			for (Character c : governors) {
				mods += c.calcLevel(Constants.charDimGovernor) * Constants.perLevelGovernRecruitMod + Constants.baseGovernRecruitMod;
			}
		}

		if (noble != null && noble.hasTag(Constants.nobleInspiringTag)) mods += Constants.nobleInspiringMod;
		if (noble != null && noble.hasTag(Constants.nobleUntrustingTag)) mods += Constants.nobleUntrustngMod;
		if (noble != null && noble.hasTag(Constants.nobleTyrannicalTag)) mods += Constants.nobleTyrannicalMod;

		NationData wKingdom = w.getNation(kingdom);
		if (wKingdom.hasTag(Constants.nationCoastDwellingTag) && isCoastal(w)) mods += Constants.coastDwellingRecruitMod;
		if (wKingdom.hasTag(Constants.nationPatrioticTag)) mods += Constants.patrioticMod;
		if (wKingdom.hasTag(Constants.nationWarlikeTag) && wKingdom.coreRegions.contains(w.regions.indexOf(this))) {
			int conquests = 0;
			for (int i = 0; i < w.regions.size(); i++) if (kingdom.equals(w.regions.get(i).kingdom) && !wKingdom.coreRegions.contains(i)) conquests++;
			mods += conquests * Constants.perConquestWarlikeRecruitmentMod;
		}

		if (religion == Ideology.RJINKU) {
			mods += Constants.rjinkuRecruitmentMod;
		} else if (religion == Ideology.SWORD_OF_TRUTH) {
			mods += Constants.swordOfTruthRecruitmentMod;
		} else if (religion == Ideology.TAPESTRY_OF_PEOPLE) {
			boolean getTapestryBonus = false;
			for (Region r : getNeighbors(w)) if (r.isLand() && (r.culture != culture || r.religion != religion)) getTapestryBonus = true;
			if (getTapestryBonus) mods += Constants.tapestryRecruitmentMod;
		} else if (religion == Ideology.RIVER_OF_KUUN && rationing >= Constants.riverOfKuunRationingThresh) {
			mods += Constants.riverOfKuunRecruitmentMod;
		}

		if (Ideology.RJINKU == NationData.getStateReligion(kingdom, w) && rulerBattled) mods += Constants.rjinkuBattledRecruitmentMod;
		if (Ideology.TAPESTRY_OF_PEOPLE == NationData.getStateReligion(kingdom, w)) mods += Constants.perIdeologyTapestryRecruitmentMod * numUniqueIdeologies(kingdom, w);
		if (NationData.getStateReligion(kingdom, w).religion == Religion.IRUHAN && Ideology.TAPESTRY_OF_PEOPLE  == w.getDominantIruhanIdeology() && NationData.getStateReligion(kingdom, w).religion == Religion.IRUHAN) {
			mods += Constants.perIdeologyTapestryRecruitmentModGlobal * numUniqueIdeologies(kingdom, w);
		}

		if (largestInRegion != null && !NationData.isFriendly(kingdom, largestInRegion.kingdom, w) && largestInRegion.hasTag(Constants.armyPillagersTag)) mods += Constants.armyPillagersRecruitmentMod;

		return Math.max(0, base * mods);
	}

	// TODO: this belongs alongside the game constants, should determine a way to parameterize these function-type rules
	public double calcSigningBonusMod(double signingBonus){
		return signingBonus <= 0 ? signingBonus * 0.5 : (Math.log(signingBonus) / Math.log(2)) * 0.5 + 0.5;
	}

	public double calcTaxIncome(World w, List<Character> governors, double taxRate, double rationing) {
		double base = population * Constants.taxPerPop;
		double unrest = calcUnrest(w);
		if (unrest > Constants.unrestTaxEffectThresh) base *= 1.0 - (unrest - Constants.unrestTaxEffectThresh);

		double mods = taxRate;

		if (governors != null) {
			for (Character c : governors) {
				mods += c.calcLevel(Constants.charDimGovernor) * Constants.perLevelGovernTaxMod + Constants.baseGovernTaxMod;
			}
		}

		if (noble != null && noble.hasTag(Constants.nobleFrugalTag)) mods += Constants.nobleFrugalMod;
		if (noble != null && noble.hasTag(Constants.nobleHoardingTag)) mods += Constants.nobleHoardingMod;

		NationData wKingdom = w.getNation(kingdom);
		if (wKingdom.hasTag(Constants.nationCoastDwellingTag) && isCoastal(w)) mods += Constants.coastDwellingTaxMod;
		if (wKingdom.hasTag(Constants.nationMercantileTag)) mods += Constants.mercantileTaxMod;
		if (wKingdom.hasTag(Constants.nationWarlikeTag) && wKingdom.coreRegions.contains(w.regions.indexOf(this))) {
			int conquests = 0;
			for (int i = 0; i < w.regions.size(); i++) if (kingdom.equals(w.regions.get(i).kingdom) && !wKingdom.coreRegions.contains(i)) conquests++;
			mods += conquests * Constants.perConquestWarlikeTaxMod;
		}

		boolean neighborKuun = false;
		for (Region r : getNeighbors(w)) {
			if (r.kingdom != null && !r.kingdom.equals(kingdom) && Ideology.RIVER_OF_KUUN == NationData.getStateReligion(r.kingdom, w)) neighborKuun = true;
		}
		if (neighborKuun) mods += Constants.riverOfKuunNeighborTaxMod;
		if (religion == Ideology.SYRJEN) {
			mods += Constants.syrjenTaxMod;
		} else if (religion == Ideology.TAPESTRY_OF_PEOPLE) {
			boolean getTapestryBonus = false;
			for (Region r : getNeighbors(w)) if (r.isLand() && (r.culture != culture || r.religion != religion)) getTapestryBonus = true;
			if (getTapestryBonus) mods += Constants.tapestryTaxMod;
		} else if (religion == Ideology.RIVER_OF_KUUN && rationing == Constants.riverOfKuunRationingThresh) {
			mods += Constants.riverOfKuunTaxMod;
		} else if (religion == Ideology.CHALICE_OF_COMPASSION) {
			mods += Constants.chaliceOfCompassionTaxMod;
		}

		if (Ideology.TAPESTRY_OF_PEOPLE == NationData.getStateReligion(kingdom, w)) mods += Constants.perIdeologyTapestryTaxMod * numUniqueIdeologies(kingdom, w);
		if (NationData.getStateReligion(kingdom, w).religion == Religion.IRUHAN && Ideology.TAPESTRY_OF_PEOPLE == w.getDominantIruhanIdeology()) mods += Constants.perIdeologyTapestryTaxModGlobal * numUniqueIdeologies(kingdom, w);

		return Math.max(0, base * mods);
	}

	public double calcConsumption(World w, double foodMod) {
		double base = population;
		double mods = foodMod;
		if (noble != null && noble.hasTag(Constants.nobleRationingTag)) mods += Constants.nobleRationingMod;
		if (noble != null && noble.hasTag(Constants.nobleWastefulTag)) mods += Constants.nobleWastefulMod;
		if (NationData.getStateReligion(kingdom, w) == Ideology.CHALICE_OF_COMPASSION) mods += Constants.chaliceOfCompassionFoodMod;
		return Math.max(0, base * mods);
	}

	public double calcPirateThreat(World w) {
		if (isSea()) return 0;
		if (religion == Ideology.ALYRJA) return 0;
		if (noble != null && noble.hasTag(Constants.noblePolicingTag)) return 0;

		double unrest = calcUnrest(w);
		double mods = 1;
		if (noble != null && noble.hasTag(Constants.nobleShadyTag)) mods += Constants.nobleShadyMod;
		if (noble != null) mods += Constants.noblePirateThreatMod;
		mods += Math.pow(2, w.pirate.bribes.getOrDefault(kingdom, 0.0) / Constants.pirateThreatDoubleGold) - 1;
		return Math.max(0, unrest * mods);
	}

	public void setReligion(Ideology bias, World w) {
		if (bias == null) bias = religion;
		HashMap<Ideology, Integer> ideologies = new HashMap<>();

		for (Construction c : constructions) {
			if (c.type.equals(Constants.constTemple)) ideologies.put(c.religion, ideologies.getOrDefault(c.religion, 0) + 1);
		}
		int maxV = ideologies.getOrDefault(bias, -1);
		Ideology max = bias;
		for (Ideology r : ideologies.keySet()) {
			if (ideologies.get(r) > maxV) {
				maxV = ideologies.get(r);
				max = r;
			}
		}
		if (Ideology.VESSEL_OF_FAITH == max && religion != max) {
			for (String k : w.getNationNames()) {
				if (Ideology.VESSEL_OF_FAITH != NationData.getStateReligion(k, w)) continue;
				for (Region r : w.regions) if (k.equals(r.kingdom)) r.unrestPopular = Math.max(0, r.unrestPopular + Constants.vesselOfFaithSetRelUnrestMod);
			}
		}
		if (max != religion) {
			for (String k : w.getNationNames()) {
				Ideology si = NationData.getStateReligion(k, w);
				if (max.religion == si.religion) w.score(k, Constants.scoreProfReligion, Constants.scoreReligionPerConverted);
				if (religion.religion == si.religion) w.score(k, Constants.scoreProfReligion, -Constants.scoreReligionPerConverted);
				if (max == si) w.score(k, Constants.scoreProfIdeology, Constants.scoreIdeologyPerConverted);
				if (religion == si) w.score(k, Constants.scoreProfIdeology, -Constants.scoreIdeologyPerConverted);
			}
		}
		religion = max;
	}

	public String getKingdom() {
		return kingdom;
	}

	public void setKingdomNoScore(String kingdom) {
		this.kingdom = kingdom;
	}

	public void setKingdom(World w, String kingdom) {
		w.score(kingdom, Constants.scoreProfTerritory, Constants.scorePerConqueredTerritory);
		w.score(this.kingdom, Constants.scoreProfTerritory, -Constants.scorePerConqueredTerritory);
		this.kingdom = kingdom;
	}

	public Set<Region> getNeighbors(World w) {
		int id = w.regions.indexOf(this);
		Set<Region> neighbors = new HashSet<>();
		for (WorldConstantData.Border b : WorldConstantData.borders) {
			if (b.a == id) neighbors.add(w.regions.get(b.b));
			else if (b.b == id) neighbors.add(w.regions.get(b.a));
		}
		return neighbors;
	}

	public boolean isCoastal(World w) {
		if (isSea()) return false;
		for (Region r : getNeighbors(w)) {
			if (r.isSea()) return true;
		}
		return false;
	}

	public Map<String, Double> calcPlotPowers(World w, List<String> boosts, int inspires) {
		Map<String, Double> powers = new HashMap<>();
		for (String kingdom : w.getNationNames()) {
			powers.put(kingdom, 0.0);
		}
		final class Node {
			public final double power;
			public final Region location;
			public Node(double power, Region location) {
				this.power = power;
				this.location = location;
			}
		}

		for (final Character c : w.characters) {
			Function<Node, Node> getPower = (Node n) -> {
				Region r = n.location;
				if (r.isSea()) return new Node(n.power * Constants.plotDecaySea, n.location);
				if (NationData.isFriendly(c.kingdom, r.kingdom, w)) {
					if (r.religion == Ideology.LYSKR) return new Node(n.power, n.location);
					return new Node(n.power * (Constants.plotDecayFriendly - r.calcUnrest(w) / 10), n.location);
				}
				return new Node(n.power * (Constants.plotDecayNonFriendly + r.calcUnrest(w) / 10), n.location);
			};

			// TODO: try this function-style equivalent instead once unit tests are created
//			PriorityQueue<Node> pq = new PriorityQueue<>(100, Comparator.comparingDouble(n -> -n.power));
			PriorityQueue<Node> pq = new PriorityQueue<>(100, new Comparator<Node>() {
				@Override
				public int compare(Node a, Node b) {
					return a.power > b.power ? -1 : a.power < b.power ? 1 : 0;
				}
			});

			Set<Region> visited = new HashSet<>();
			pq.add(getPower.apply(new Node(c.calcPlotPower(w, boosts.contains(c.kingdom), inspires), w.regions.get(c.location))));
			while (!pq.isEmpty()) {
				Node n = pq.poll();
				if (visited.contains(n.location)) continue;
				visited.add(n.location);
				if (n.location == this) {
					powers.put(c.kingdom, Math.max(powers.get(c.kingdom), n.power));
					break;
				}
				for (Region r : n.location.getNeighbors(w)) {
					if (!visited.contains(r)) pq.add(getPower.apply(new Node(n.power, r)));
				}
			}
		}
		return powers;
	}

	public double calcUnrest(World w) {
		return Math.min(1.0, Math.max(getUnrestPopular(), Math.max(calcUnrestClerical(w), calcUnrestNoble())));
	}

	public double getUnrestPopular(){
		return unrestPopular;
	}

	// TODO: Move to a different class (don't know which one but I think there is probably a better home, idea: Ideology)
	// TODO: Enforce [0.0, 1.0] range wherever this goes?
	public double calcUnrestClerical(World w){
		return religion.religion == Religion.IRUHAN && religion != Ideology.VESSEL_OF_FAITH ?
				-w.getNation(kingdom).goodwill * Constants.clericalUnrestGoodwillFactor : 0.0;
	}

	// TODO: Some or all of the condition checking into Noble?
	// TODO: Enforce [0.0, 1.0] range?
	public double calcUnrestNoble(){
		return noble != null && !"".equals(noble.name) ? noble.unrest : 0.0;
	}

	// TODO: Enfore min/max, add testing
	public double calcMinConquestStrength(World w) {
		double base = calcBaseConquestStrength(w);
		double mods = 1;
		if (noble != null && noble.hasTag(Constants.nobleLoyalTag)) mods += Constants.loyalMinConqMod;
		if (noble != null && noble.hasTag(Constants.nobleDesperateTag)) mods += Constants.nobleDesperateMod;
		if (w.getNation(kingdom).hasTag(Constants.nationStoicTag)) mods += Constants.stoicConqStrengthMod;
		mods += calcFortificationMod();
		return Math.max(0, base * mods);
	}

	// TODO: This is a game rule/equation
	public double calcBaseConquestStrength(World w){
		return Math.sqrt(population) * 6 / 100 * (1 - calcUnrest(w) / 2);
	}

	// TODO: This is a game rule/equation
	public double calcMinPatrolStrength(World w) {
		return 0.03 * Math.sqrt(population) * (1 + (2 * calcUnrest(w) - 0.7));
	}

	public double calcFortificationPct() {
		double fort = 1;
		for (Construction c : constructions) if (c.type.equals(Constants.constFort)) fort += Constants.perFortMod;
		return Math.min(Constants.maxFortMod, fort);
	}

	public double calcFortificationMod() {
		return calcFortificationPct() - 1;
	}

	public boolean isLand() {
		return type == Type.LAND;
	}

	public boolean isSea() {
		return type == Type.WATER;
	}
}

class Construction {
	String type;
	Ideology religion; // Only for type == "temple".
	double originalCost;

	static Construction makeTemple(Ideology religion, double cost) {
		Construction c = new Construction();
		c.type = "temple";
		c.religion = religion;
		c.originalCost = cost;
		return c;
	}

	static Construction makeFortification(double cost) {
		Construction c = new Construction();
		c.type = "fortifications";
		c.originalCost = cost;
		return c;
	}
}
