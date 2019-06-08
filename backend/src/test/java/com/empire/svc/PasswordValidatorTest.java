package com.empire.svc;

import com.empire.store.DatastoreClient;
import org.junit.Before;
import org.junit.Test;
import static org.junit.Assert.assertEquals;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

public class PasswordValidatorTest {
  private static DatastoreClient dsClient;
  private static PasswordValidator passVal;
  private static Request req;

//  private final String emailTest = "test@email.com";
//  private final long gameIdTest = -1;
//  private final int turnTest = 5;
//  private final String kingdomTest = "TEST_KINGDOM";
//  private final String pwTest = "0123456789ABCDEF";
//  private final String pwEncTest = "CB469D8CFBD5CB38935AD4C8CBAE397A41A42ADCB85D2D5858550465F7BD31FC";

  @Before
  public void setup() {
    DatastoreClient dsClient = mock(DatastoreClient.class);
    passVal = new PasswordValidator(dsClient);

    req = mock(Request.class);
  }

  @Test
  public void nullPassworldReturnsFailure() {
    when(req.getPassword()).thenReturn(null);

    assertEquals(passVal.checkPassword(req), PasswordValidator.PasswordCheck.FAIL);
  }

//  private void passPasswordCheck() {
//    when(req.getPassword()).thenReturn(pwTest);
//    when(dsClient.getWorldDate(gameIdTest)).thenReturn(Optional.of(turnTest));
//    when(dsClient.getOrders(gameIdTest, kingdomTest, turnTest)).thenReturn(Optional.empty());
//
//    NationData k = mock(NationData.class);
//    k.email = emailTest;
//
//    World w = mock(World.class);
//    w.gmPasswordHash = pwTest;
//    w.obsPasswordHash = pwTest;
//    when(w.getNation(kingdomTest)).thenReturn(k);
//    when(w.getNationNames()).thenReturn(Collections.singleton(kingdomTest));
//    when(dsClient.getWorld(gameIdTest, turnTest)).thenReturn(Optional.of(w));
//
//    Player p = mock(Player.class);
//    when(p.getPassHash()).thenReturn(pwEncTest);
//    when(dsClient.getPlayer(emailTest)).thenReturn(Optional.of(p));
//  }
}
