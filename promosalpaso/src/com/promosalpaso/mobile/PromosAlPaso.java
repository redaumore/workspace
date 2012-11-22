package com.promosalpaso.mobile;

import android.os.Bundle;
import org.apache.cordova.*;

//import android.app.Activity;
//import android.view.Menu;

public class PromosAlPaso extends DroidGap {

	@Override
	public void onCreate(Bundle savedInstanceState) {
		super.onCreate(savedInstanceState);
		super.setIntegerProperty("loadUrlTimeoutValue", 60000); 
		super.loadUrl("file:///android_asset/www/index1.html");
		}

}
