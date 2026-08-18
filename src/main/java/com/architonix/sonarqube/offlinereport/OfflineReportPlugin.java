package com.architonix.sonarqube.offlinereport;

import org.sonar.api.Plugin;

/** Plugin entry point. Report generation deliberately runs in the user's browser. */
public final class OfflineReportPlugin implements Plugin {
  @Override
  public void define(Context context) {
    context.addExtension(OfflineReportPageDefinition.class);
  }
}
