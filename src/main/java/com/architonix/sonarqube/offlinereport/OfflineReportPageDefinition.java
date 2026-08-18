package com.architonix.sonarqube.offlinereport;

import org.sonar.api.web.page.Context;
import org.sonar.api.web.page.Page;
import org.sonar.api.web.page.PageDefinition;

/** Adds an export page to projects for users who can browse that project. */
public final class OfflineReportPageDefinition implements PageDefinition {
  public static final String PAGE_KEY = "offlinereport/report_page";

  @Override
  public void define(Context context) {
    context.addPage(Page.builder(PAGE_KEY)
      .setName("Offline Report")
      .setScope(Page.Scope.COMPONENT)
      .setComponentQualifiers(Page.Qualifier.PROJECT)
      .build());
  }
}
