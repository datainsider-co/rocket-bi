// @ts-ignore
import { NavigationItem } from '@/shared/components/Common/NavigationPanel.vue';
import { Routers } from '@/shared';
import { Component, Vue } from 'vue-property-decorator';
import { LayoutSidebar, LayoutContent, LayoutHeader } from '@/shared/components/LayoutWrapper';

@Component({
  components: {
    LayoutSidebar,
    LayoutContent,
    LayoutHeader
  }
})
export default class CDPMixin extends Vue {
  private get navItems(): NavigationItem[] {
    return [
      {
        id: Routers.PathExplorer,
        displayName: 'Path Explorer',
        icon: 'di-icon-direction',
        to: { name: Routers.PathExplorer }
      },
      {
        id: Routers.EventAnalysis,
        displayName: 'Event Analysis',
        icon: 'di-icon-statistics',
        to: { name: Routers.EventAnalysis }
      },
      {
        id: Routers.FunnelAnalysis,
        displayName: 'Funnel Analysis',
        icon: 'di-icon-funnel-analysis',
        to: { name: Routers.FunnelAnalysis }
      },
      {
        id: Routers.CohortManagement,
        displayName: 'Cohorts Management',
        icon: 'di-icon-user',
        to: { name: Routers.CohortManagement }
      },
      {
        id: Routers.RetentionAnalysis,
        displayName: 'Retention Analysis',
        icon: 'di-icon-cohort-analysis',
        to: { name: Routers.RetentionAnalysis }
      },
      {
        id: Routers.Customer360,
        displayName: 'Customers',
        icon: 'di-icon-cohort',
        to: { name: Routers.Customer360 }
      }
    ];
  }
}
