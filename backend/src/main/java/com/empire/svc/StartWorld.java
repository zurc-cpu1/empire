package com.empire.svc;

import com.empire.Schedule;
import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.google.gson.FieldNamingPolicy;
import java.util.List;
import java.util.ArrayList;

class StartWorld {
	public String gmPassword;
	public String obsPassword;
	public List<String> kingdoms = new ArrayList<String>(); 
	public Schedule schedule;

	private static Gson getGson() {
		return new GsonBuilder().setFieldNamingPolicy(FieldNamingPolicy.LOWER_CASE_WITH_UNDERSCORES).create();
	}

	public static StartWorld fromJson(String json) {
		return getGson().fromJson(json, StartWorld.class);
	}
}
