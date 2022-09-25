<template>
  <LayoutWrapper no-sidebar>
    <LayoutContent>
      <LayoutHeader title="Job Builder" icon="di-icon-query-editor">
        <BreadcrumbComponent :breadcrumbs="breadcrumbs"></BreadcrumbComponent>
      </LayoutHeader>
      <router-view :job="job" />
    </LayoutContent>
  </LayoutWrapper>
</template>

<script lang="ts">
import { Component, Provide, Vue, Watch } from 'vue-property-decorator';
import DiPage from '@/screens/LakeHouse/Components/QueryBuilder/DiPage.vue';
import { Routers } from '@/shared';
import { Breadcrumbs } from '@/shared/models';
import BreadcrumbComponent from '@/screens/Directory/components/BreadcrumbComponent.vue';
import { LakeJob } from '@core/LakeHouse/Domain/LakeJob/LakeJob';
import { toNumber } from 'lodash';
import { Log } from '@core/utils';
import { Inject } from 'typescript-ioc';
import { LakeJobService } from '@core/LakeHouse/Service/LakeJobService';
import { RouterUtils } from '@/utils/RouterUtils';
import { LoggedInScreen } from '@/shared/components/VueHook/LoggedInScreen';
import { LayoutWrapper, LayoutContent, LayoutHeader } from '@/shared/components/LayoutWrapper';

@Component({
  components: { BreadcrumbComponent, LayoutWrapper, LayoutContent, LayoutHeader, DiPage }
})
export default class QueryBuilder extends LoggedInScreen {
  private job: LakeJob | null = null;

  @Inject
  private readonly lakeJobService!: LakeJobService;

  private get schedulerId(): string | null {
    return (this.$route.query.schedulerId as any) ?? null;
  }

  private get breadcrumbs() {
    return this.job ? [new Breadcrumbs({ text: this.job.name, to: { query: { ...this.$route.query } } })] : [];
  }

  async mounted() {
    if (this.schedulerId) {
      await this.handleLoadLakeJob(this.schedulerId);
    } else {
      this.job = null;
    }
  }

  @Watch('schedulerId')
  async onChangeJobId(schedulerId: string | null) {
    if (schedulerId) {
      await this.handleLoadLakeJob(schedulerId);
    } else {
      this.job = null;
    }
  }

  private async handleLoadLakeJob(queryId: string) {
    try {
      const lakeJobInfo = await this.lakeJobService.get(toNumber(queryId));
      this.job = lakeJobInfo.job;
      if (this.job) {
        this.$emit('breadcrumbChange', [new Breadcrumbs({ text: this.job.name, to: '#' })]);
      }
    } catch (ex) {
      Log.error('QueryBuilder::handleLoadLakeJob::exception::', ex);
    }
  }

  private redirectToCreateJob() {
    this.job = null;
    if (this.schedulerId) {
      RouterUtils.to(this.$route.name as Routers, {});
    }
  }
}
</script>
