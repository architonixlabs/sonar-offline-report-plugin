package com.architonix.sonarqube.offlinereport;

import java.util.Collection;
import org.junit.Test;
import org.sonar.api.web.page.Context;
import org.sonar.api.web.page.Page;

import static org.assertj.core.api.Assertions.assertThat;

public class OfflineReportPageDefinitionTest {
  @Test
  public void registersAProjectScopedPage() {
    Context context = new Context();

    new OfflineReportPageDefinition().define(context);

    Collection<Page> pages = context.getPages();
    assertThat(pages).hasSize(1);
    Page page = pages.iterator().next();
    assertThat(page.getKey()).isEqualTo("offlinereport/report_page");
    assertThat(page.getName()).isEqualTo("Offline Report");
    assertThat(page.getScope()).isEqualTo(Page.Scope.COMPONENT);
    assertThat(page.getComponentQualifiers()).containsExactly(Page.Qualifier.PROJECT);
  }
}
