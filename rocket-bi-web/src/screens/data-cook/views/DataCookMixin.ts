// @ts-ignore
import { NavigationItem } from '@/shared/components/common/NavigationPanel.vue';
import { Routers } from '@/shared';
import { Component, Vue } from 'vue-property-decorator';

@Component
export default class DataCookMixin extends Vue {
  private get navItems(): NavigationItem[] {
    return [
      {
        id: Routers.MyEtl,
        displayName: 'My ETL',
        icon: 'di-icon-etl-home',
        to: { name: Routers.MyEtl }
      },
      {
        id: Routers.SharedEtl,
        displayName: 'Share With Me',
        icon: 'di-icon-share-with-me',
        to: { name: Routers.SharedEtl }
      },
      {
        id: Routers.EtlHistory,
        displayName: 'ETL History',
        icon: 'di-icon-restore',
        to: { name: Routers.EtlHistory }
      },
      {
        id: Routers.ArchivedEtl,
        displayName: 'Trash',
        icon: 'di-icon-delete',
        to: { name: Routers.ArchivedEtl }
      }
    ];
  }
}
