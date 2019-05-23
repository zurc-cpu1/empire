package com.empire;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import org.junit.Before;
import org.junit.Test;
import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

public class ArmyTest {
	private static Army a;
	private static World w;
	private static NationData n1;
	private static final double DELTA = 1E-5;

	private static final String k1 = "k1";
	private static final String k2 = "k2";

	@Before
	public void setUpPlainArmy() {
		a = new Army();
		a.type = Army.Type.ARMY;
		a.size = 100.0;
		a.kingdom = k1;
		a.location = 0;

		w = mockWorld();
		w.armies = Collections.singletonList(a);
	}


	private World mockWorld() {
		World w = mock(World.class);
		w.notifications = new ArrayList<>();

		n1 = mock(NationData.class);
		Relationship rel1 = mock(Relationship.class);
		rel1.battle = Relationship.War.ATTACK;
		when(n1.getRelationship(k2)).thenReturn(rel1);
		when(w.getNation(k1)).thenReturn(n1);

		NationData n2 = mock(NationData.class);
		Relationship rel2 = mock(Relationship.class);
		rel2.battle = Relationship.War.ATTACK;
		when(n2.getRelationship(k1)).thenReturn(rel2);
		when(w.getNation(k2)).thenReturn(n2);

		Region r1 = Mocks.region(k1, Region.Type.LAND, 1.0, Ideology.COMPANY);
		Region r2 = Mocks.region(k1, Region.Type.LAND, 1.0, Ideology.COMPANY);
		r2.noble = Mocks.noble(Constants.nobleLoyalTag, 0.0);
		w.regions = Arrays.asList(r1, r2);
		return w;
	}

	@Test
	public void calcStrengthBasic() {
		assertEquals(1.0, a.calcStrength(w, null, 0, false), DELTA);
	}

	@Test
	public void calcStrengthNavy() {
		a.type = Army.Type.NAVY;
		assertEquals(100.0, a.calcStrength(w, null, 0, false), DELTA);
	}

	@Test
	public void calcStrengthSteel() {
		a.addTag(Constants.armySteelTag);
		assertEquals(1.15, a.calcStrength(w, null, 0, false), DELTA);
	}

	@Test
	public void calcStrengthSeafaringOnLand() {
		a.addTag(Constants.armySeafaringTag);
		assertEquals(1.0, a.calcStrength(w, null, 0, false), DELTA);
	}

	@Test
	public void calcStrengthSeafaring() {
		a.addTag(Constants.armySeafaringTag);
		when(w.regions.get(0).isSea()).thenReturn(true);
		assertEquals(2.5, a.calcStrength(w, null, 0, false), DELTA);
	}

	@Test
	public void calcStrengthDisciplinedNavy() {
		a.type = Army.Type.NAVY;
		when(n1.hasTag(Constants.nationDisciplinedTag)).thenReturn(true);
		assertEquals(100.0, a.calcStrength(w, null, 0, false), DELTA);
	}

	@Test
	public void calcStrengthDisciplinedPirate() {
		a.kingdom = Constants.pirateKingdom;
		w.getNation(k1).addTag(Constants.nationDisciplinedTag);
		assertEquals(1.0, a.calcStrength(w, null, 0, false), DELTA);
	}

	@Test
	public void calcStrengthDisciplined() {
		when(n1.hasTag(Constants.nationDisciplinedTag)).thenReturn(true);
		assertEquals(1.1, a.calcStrength(w, null, 0, false), DELTA);
	}

	@Test
	public void calcStrengthFortificationNavy() {
		a.type = Army.Type.NAVY;
		when(w.regions.get(0).calcFortificationMod()).thenReturn(0.3);
		assertEquals(100.0, a.calcStrength(w, null, 0, false), DELTA);
	}

	@Test
	public void calcStrengthFortificationWater() {
		when(w.regions.get(0).calcFortificationMod()).thenReturn(0.3);
		when(w.regions.get(0).isLand()).thenReturn(false);
		assertEquals(1.0, a.calcStrength(w, null, 0, false), DELTA);
	}

	@Test
	public void calcStrengthFortificationNotFriendly() {
		a.kingdom = k2;
		when(w.regions.get(0).calcFortificationMod()).thenReturn(0.3);
		assertEquals(1.0, a.calcStrength(w, null, 0, false), DELTA);
	}

	@Test
	public void calcStrengthFortification() {
		when(w.regions.get(0).calcFortificationMod()).thenReturn(0.3);
		when(w.regions.get(0).isLand()).thenReturn(true);
		assertEquals(1.3, a.calcStrength(w, null, 0, false), DELTA);
	}

	@Test
	public void calcStrengthLoyalNavy() {
		a.location = 1;
		a.type = Army.Type.NAVY;
		assertEquals(100.0, a.calcStrength(w, null, 0, false), DELTA);
	}

	@Test
	public void calcStrengthLoyalNotRegionOwner() {
		a.location = 1;
		when(w.regions.get(1).getKingdom()).thenReturn(k2);
		assertEquals(1.0, a.calcStrength(w, null, 0, false), DELTA);
	}

	@Test
	public void calcStrengthLoyal() {
		a.location = 1;
		assertEquals(1.25, a.calcStrength(w, null, 0, false), DELTA);
	}

	@Test
	public void calcStrengthSwordOfTruthNonIruhan() {
		w.regions.get(0).religion = Ideology.ALYRJA;
		when(w.getDominantIruhanIdeology()).thenReturn(Ideology.SWORD_OF_TRUTH);
		assertEquals(1.0, a.calcStrength(w, null, 0, false), DELTA);
	}

	@Test
	public void calcStrengthSwordOfTruthAligned() {
		when(w.getDominantIruhanIdeology()).thenReturn(Ideology.SWORD_OF_TRUTH);
		w.regions.get(0).religion = Ideology.SWORD_OF_TRUTH;
		w.regions.get(0).population = 1E9;
		assertEquals(1.25, a.calcStrength(w, null, 0, false), DELTA);
	}

	@Test
	public void calcStrengthSwordOfTruthNonAligned() {
		when(w.getDominantIruhanIdeology()).thenReturn(Ideology.SWORD_OF_TRUTH);
		w.regions.get(0).religion = Ideology.CHALICE_OF_COMPASSION;
		w.regions.get(0).population = 1E9;
		assertEquals(1.15, a.calcStrength(w, null, 0, false), DELTA);
	}

	@Test
	public void calcStrengthLastStand() {
		assertEquals(5.0, a.calcStrength(w, null, 0, true), DELTA);
	}

	@Test
	public void calcStrengthInspireNavy() {
		w.regions.get(0).religion = Ideology.CHALICE_OF_COMPASSION;
		a.type = Army.Type.NAVY;
		assertEquals(100.0, a.calcStrength(w, null, 2, false), DELTA);
	}

	@Test
	public void calcStrengthInspire() {
		w.regions.get(0).religion = Ideology.CHALICE_OF_COMPASSION;
		w.regions.get(0).population = 1E9;
		assertEquals(1.1, a.calcStrength(w, null, 2, false), DELTA);
	}

	@Test
	public void calcStrengthCaptured() {
		Character leader = Mocks.character(3.0);
		leader.captor = "DONTCARE";
		assertEquals(1.0, a.calcStrength(w, leader, 0, false), DELTA);
	}

	@Test
	public void calcStrengthGeneral() {
		Character c = Mocks.character(3.0);
		when(c.calcLevel(Constants.charDimGeneral)).thenReturn(2);
		assertEquals(1.4, a.calcStrength(w, c, 0, false), DELTA);
	}

	@Test
	public void calcStrengthAdmiral() {
		a.type = Army.Type.NAVY;
		Character c = Mocks.character(3.0);
		when(c.calcLevel(Constants.charDimAdmiral)).thenReturn(2);
		assertEquals(140.0, a.calcStrength(w, c, 0, false), DELTA);
	}

	@Test
	public void razeNothingToRaze() {
		assertEquals(0, w.regions.get(0).constructions.size());
		assertEquals(0, a.raze(w, "Raze temple Iruhan (Sword of Truth)", null, 0, false), DELTA);
	}

	@Test
	public void razeOne() {
		Region r = w.regions.get(0);
		r.religion = Ideology.SWORD_OF_TRUTH;
		r.constructions.add(Construction.makeTemple(Ideology.SWORD_OF_TRUTH, 100));

		assertEquals(r.religion, Ideology.SWORD_OF_TRUTH);
		assertEquals(80, a.raze(w, "Raze temple Iruhan (Sword of Truth)", null, 0, false), DELTA);
		assertEquals(r.religion, Ideology.SWORD_OF_TRUTH);
		assertEquals(0, r.constructions.size());
	}

	@Test
	public void razeMultiple() {
		Region r = w.regions.get(0);
		r.constructions.add(Construction.makeTemple(Ideology.SWORD_OF_TRUTH, 100));
		r.constructions.add(Construction.makeTemple(Ideology.SWORD_OF_TRUTH, 100));
		when(r.calcMinConquestStrength(w)).thenReturn(0.1);

		assertEquals(160, a.raze(w, "Raze temple Iruhan (Sword of Truth)", null, 0, false), DELTA);
	}

	@Test
	public void razeRequiresMinimumStrength() {
		Region r = w.regions.get(0);
		when(r.calcMinConquestStrength(w)).thenReturn(100.0);
		assertEquals(0, a.raze(w, "Raze temple Iruhan (Vessel of Faith)", null, 0, false), DELTA);
	}

	@Test
	public void raze() {
		Region r = w.regions.get(0);
		r.population = 1000;
		r.religion = Ideology.SWORD_OF_TRUTH;
		r.constructions = new ArrayList<>();

		// Nothing to raze.
		assertEquals(0, r.constructions.size());
		assertEquals(0, a.raze(w, "Raze temple Iruhan (Sword of Truth)", null, 0, false), DELTA);

		// Raze one temple.
		r.constructions.add(Construction.makeTemple(Ideology.SWORD_OF_TRUTH, 100));
		r.setReligion(null, w);
		assertEquals(r.religion, Ideology.SWORD_OF_TRUTH);
		assertEquals(80, a.raze(w, "Raze temple Iruhan (Sword of Truth)", null, 0, false), DELTA);
		assertEquals(r.religion, Ideology.SWORD_OF_TRUTH);
		assertEquals(0, r.constructions.size());
		assertEquals(0, a.raze(w, "Raze temple Iruhan (Sword of Truth)", null, 0, false), DELTA);

		//TODO: This test does not belong in the Army class, the Region should be responsible for determining how its religion has changed, this is impossible to properly/effectively test as written
		// Razing temple changes religion.
//		r.constructions.add(Construction.makeTemple(Ideology.SWORD_OF_TRUTH, 100));
//		r.constructions.add(Construction.makeTemple(Ideology.SWORD_OF_TRUTH, 100));
//		r.constructions.add(Construction.makeTemple(Ideology.VESSEL_OF_FAITH, 100));
//		r.setReligion(null, w);
//		assertEquals(Ideology.SWORD_OF_TRUTH, r.religion);
//		assertEquals(80, a.raze(w, "Raze temple Iruhan (Sword of Truth)", null, 0, false), DELTA);
//		assertEquals(Ideology.SWORD_OF_TRUTH, r.religion);
//		assertEquals(80, a.raze(w, "Raze temple Iruhan (Sword of Truth)", null, 0, false), DELTA);
//		assertEquals(1, r.constructions.size());
//		assertEquals(Ideology.VESSEL_OF_FAITH, r.religion);
//		assertEquals(0, a.raze(w, "Raze temple Iruhan (Sword of Truth)", null, 0, false), DELTA);
//		assertEquals(1, r.constructions.size());

		// Razing requires a minimum strength.
		r.population = 1000000;
		assertEquals(0, a.raze(w, "Raze temple Iruhan (Vessel of Faith)", null, 0, false), DELTA);

		// Razing can raze multiple buildings in one action.
		r.population = 100;
		r.constructions.add(Construction.makeTemple(Ideology.SWORD_OF_TRUTH, 100));
		r.constructions.add(Construction.makeTemple(Ideology.SWORD_OF_TRUTH, 100));
		assertEquals(160, a.raze(w, "Raze temple Iruhan (Sword of Truth)", null, 0, false), DELTA);
	}

	@Test
	public void conquerBasic() {
		a.kingdom = k2;
		Region r = w.regions.get(0);
		when(r.isLand()).thenReturn(true);
		when(r.calcMinConquestStrength(w)).thenReturn(0.1);

		HashSet<Region> conqueredRegions = new HashSet<>();
		a.conquer(w, "Conquer", conqueredRegions, new HashMap<>(), new HashMap<>(), 0, new HashSet<>());
		assertTrue(conqueredRegions.contains(r));
//		assertEquals(k2, r.getKingdom());
	}

	@Test
	public void conquerRequiresMinimumStrength() {
		a.kingdom = k2;
		Region r = w.regions.get(0);
		when(r.isLand()).thenReturn(true);
		when(r.calcMinConquestStrength(w)).thenReturn(100.0);

		HashSet<Region> conqueredRegions = new HashSet<>();
		a.conquer(w, "Conquer", conqueredRegions, new HashMap<>(), new HashMap<>(), 0, new HashSet<>());
		assertTrue(conqueredRegions.isEmpty());
//		assertEquals(k1, r.getKingdom());
	}

	@Test
	public void conquerDestroysFortifications() {
		a.kingdom = k2;
		Region r = w.regions.get(0);
		r.constructions = new ArrayList<>();
		r.constructions.add(Construction.makeFortification(40));
		r.constructions.add(Construction.makeFortification(40));
		r.constructions.add(Construction.makeFortification(40));
		when(r.isLand()).thenReturn(true);
		when(r.calcMinConquestStrength(w)).thenReturn(0.1);

		HashSet<Region> conqueredRegions = new HashSet<>();
		a.conquer(w, "Conquer", conqueredRegions, new HashMap<>(), new HashMap<>(), 0, new HashSet<>());
		assertTrue(r.constructions.isEmpty());
		assertTrue(conqueredRegions.contains(r));
//		assertEquals(k2, r.getKingdom());
	}

//	@Test
//	public void conquer() {
//		// Basic conquest.
//		Region r = w.regions.get(0);
//		r.religion = Ideology.SWORD_OF_TRUTH;
//		when(r.isLand()).thenReturn(true);
//		r.setKingdomNoScore(k2);
//		HashSet<Region> conqueredRegions = new HashSet<>();
//		a.conquer(w, "Conquer", conqueredRegions, new HashMap<>(), new HashMap<>(), 0, new HashSet<>());
//		assertTrue(conqueredRegions.contains(r));
//		assertEquals(k1, r.getKingdom());
//
//		// Conquest requires a minimum size.
//		r.population = 100000;
//		r.setKingdomNoScore(k2);
//		conqueredRegions.clear();
//		a.conquer(w, "Conquer", conqueredRegions, new HashMap<>(), new HashMap<>(), 0, new HashSet<>());
//		assertTrue(conqueredRegions.isEmpty());
//		assertEquals(k2, r.getKingdom());
//
//		// Conquest destroys fortifications.
//		r.population = 100;
//		r.constructions.add(Construction.makeFortification(40));
//		r.constructions.add(Construction.makeFortification(40));
//		r.constructions.add(Construction.makeFortification(40));
//		a.conquer(w, "Conquer", conqueredRegions, new HashMap<>(), new HashMap<>(), 0, new HashSet<>());
//		assertTrue(conqueredRegions.contains(r));
//		assertEquals(k1, r.getKingdom());
//		assertTrue(r.constructions.isEmpty());
//	}
}
