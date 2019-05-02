package com.empire;

import org.junit.Before;
import org.junit.Test;

import java.util.Arrays;
import java.util.List;

import static org.junit.Assert.assertEquals;

public class CharacterTest {
    private Character c;
    private static World world;
    private static double delta = 1E-5;

    @Before
    public void createCharacter(){
        c = new Character();
        c.kingdom = "k1";
        setExperience(0.0);

        world = WorldTest.emptyTestWorld();
    }

    private void setExperience(double exp){
        setExperience(exp, exp, exp, exp);
    }

    private void setExperience(double general, double admiral, double governor, double spy){
        c.experience.put(Constants.charDimGeneral, general);
        c.experience.put(Constants.charDimAdmiral, admiral);
        c.experience.put(Constants.charDimGovernor, governor);
        c.experience.put(Constants.charDimSpy, spy);
    }

    private void addHeroicTag(){
        world.getNation("k1").addTag(Constants.nationHeroicTag);
    }

    private void assertDimsExpEqual(double general, double admiral, double governor, double spy){
        assertEquals(general, c.getExperience(Constants.charDimGeneral), delta);
        assertEquals(admiral, c.getExperience(Constants.charDimAdmiral), delta);
        assertEquals(governor, c.getExperience(Constants.charDimGovernor), delta);
        assertEquals(spy, c.getExperience(Constants.charDimSpy), delta);
    }

    @Test
    public void calcLevelAll(){
        List<Double> expLevel = Arrays.asList(1.0, 4.0, 9.0, 16.0, 25.0);

        for(int level = 1; level <= 5; level++) {
            setExperience(expLevel.get(level-1));
            assertEquals(level, c.calcLevel(Constants.charDimGeneral));
            assertEquals(level, c.calcLevel(Constants.charDimAdmiral));
            assertEquals(level, c.calcLevel(Constants.charDimGovernor));
            assertEquals(level, c.calcLevel(Constants.charDimSpy));
        }
    }

    @Test(expected=NullPointerException.class)
    public void calcLevelUnknownDimThrowsError(){
        // Not a great test but have something in here about unknown keys, could be fixed by using enum
        c.calcLevel("DUMMY");
    }

    @Test
    public void addExperienceGeneralRegular(){
        c.addExperience(Constants.charDimGeneral, world);
        assertDimsExpEqual(1.0, 0.0, 0.0, 0.0);
    }

    @Test
    public void addExperienceAdmirallRegular(){
        c.addExperience(Constants.charDimAdmiral, world);
        assertDimsExpEqual(0.0, 1.0, 0.0, 0.0);
    }

    @Test
    public void addExperienceGovernorRegular(){
        c.addExperience(Constants.charDimGovernor, world);
        assertDimsExpEqual(0.0, 0.0, 1.0, 0.0);
    }

    @Test
    public void addExperienceSpyRegular(){
        c.addExperience(Constants.charDimSpy, world);
        assertDimsExpEqual(0.0, 0.0, 0.0, 1.0);

    }

    @Test
    public void addExperienceAllRegular(){
        c.addExperience(Constants.charDimAll, world);
        assertDimsExpEqual(0.25, 0.25, 0.25, 0.25);
    }

    @Test
    public void addExperienceGeneralHeroic(){
        addHeroicTag();
        c.addExperience(Constants.charDimGeneral, world);
        assertDimsExpEqual(2.0, 0.0, 0.0, 0.0);
    }

    @Test
    public void addExperienceAdmiralHeroic(){
        addHeroicTag();
        c.addExperience(Constants.charDimAdmiral, world);
        assertDimsExpEqual(0.0, 2.0, 0.0, 0.0);
    }

    @Test
    public void addExperienceGovernorHeroic(){
        addHeroicTag();
        c.addExperience(Constants.charDimGovernor, world);
        assertDimsExpEqual(0.0, 0.0, 2.0, 0.0);
    }

    @Test
    public void addExperienceSpyHeroic(){
        addHeroicTag();
        c.addExperience(Constants.charDimSpy, world);
        assertDimsExpEqual(0.0, 0.0, 0.0, 2.0);
    }

    @Test
    public void addExperienceAllHeroic(){
        addHeroicTag();
        c.addExperience(Constants.charDimAll, world);
        assertDimsExpEqual(0.5, 0.5, 0.5, 0.5);
    }
}
