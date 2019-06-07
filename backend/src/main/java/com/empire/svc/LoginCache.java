package com.empire.svc;

import com.empire.store.DatastoreClient;
import com.empire.store.GaeDatastoreClient;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

class LoginCache {
    private static LoginCache instance;

    public static LoginCache getInstance() {
        if(instance == null) {
            instance = new LoginCache(GaeDatastoreClient.getInstance());
        }

        return instance;
    }

    private final DatastoreClient client;
    private final Set<LoginKey> recordedKeys;

    LoginCache(DatastoreClient client) {
        this.client = client;
        this.recordedKeys = new HashSet<>();
    }

    public void clear() {
        recordedKeys.clear();
    }

    public Set<LoginKey> getRecordedKeys() {
        return recordedKeys;
    }

    public synchronized void recordLogin(String email, long gameId, int date) {
        LoginKey login = new LoginKey(email, gameId, date);

        if (recordedKeys.contains(login)) return;

        recordedKeys.add(login);
        client.putLogin(email, gameId, date);
    }

    public List<List<Boolean>> fetchLoginHistory(List<String> emails, long gameId, int finalDate) {
        return IntStream.rangeClosed(1, finalDate)
            .mapToObj(i -> checkLogin(emails, gameId, i))
            .collect(Collectors.toList());
    }

    synchronized List<Boolean> checkLogin(Iterable<String> emails, long gameId, int date) {
        List<Boolean> result = new ArrayList<>();

        for (String email : emails) {
            LoginKey nu = new LoginKey(email, gameId, date);
            if (recordedKeys.contains(nu)) {
                result.add(true);
            } else {
                result.add(client.getLogin(email, gameId, date).isPresent());
            }
        }

        return result;
    }
}
