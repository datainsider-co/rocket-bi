<template>
  <div class="d-flex justify-content-between align-items-center">
    <div class="title-container">
      <i class="icon" :class="dataManagementTitle.icon"></i>
      <span class="title">{{ dataManagementTitle.title }}</span>
    </div>
    <!--    <div class="user-header-actions d-flex align-items-center">-->
    <!--      <router-link :to="databaseManagementRoute" class="user-header-actions&#45;&#45;item">-->
    <!--        <i class="di-icon-database mr-1"></i>-->
    <!--        All Database-->
    <!--      </router-link>-->
    <!--      <router-link :to="dataSchemaRoute" class="user-header-actions&#45;&#45;item">-->
    <!--        <i class="di-icon-schema mr-1"></i>-->
    <!--        Schema-->
    <!--      </router-link>-->
    <!--      <router-link :to="queryEditorRoute" class="user-header-actions&#45;&#45;item">-->
    <!--        <i class="di-icon-query-editor mr-1"></i>-->
    <!--        Query Editor-->
    <!--      </router-link>-->
    <!--      <router-link :to="dataRelationshipRoute" class="user-header-actions&#45;&#45;item">-->
    <!--        <i class="di-icon-relationship mr-1"></i>-->
    <!--        Relationship-->
    <!--      </router-link>-->
    <!--    </div>-->
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import { Routers } from '@/shared';
import DatabaseWarehouseIcon from '@/shared/components/Icon/DataWarehouseIcon.vue';
import DataWarehouseIcon from '@/shared/components/Icon/DataWarehouseIcon.vue';
@Component({
  components: { DataWarehouseIcon, DatabaseIcon: DatabaseWarehouseIcon }
})
export default class DataManagementHeader extends Vue {
  private dataSchemaRoute = { name: Routers.DataSchema };
  private databaseManagementRoute = { name: Routers.Database };
  private queryEditorRoute = { name: Routers.QueryEditor };
  private dataRelationshipRoute = { name: Routers.DataRelationship };

  private get dataManagementTitle() {
    switch (this.$route.name) {
      case Routers.QueryEditor:
        return {
          icon: 'di-icon-query-editor',
          title: 'Query Analysis'
        };
      case Routers.DataRelationship:
        return {
          icon: 'di-icon-relationship',
          title: 'Relationship'
        };
      default:
        return {
          icon: 'di-icon-schema',
          title: 'Schema'
        };
    }
  }
}
</script>

<style lang="scss" scoped>
@import '~@/themes/scss/mixin';

.title-container {
  display: flex;
  .icon {
    font-size: 24px;
    margin-right: 16px;
  }
  .title {
    @include regular-text();
    font-size: 24px;
    font-weight: 500;
  }
}
</style>
