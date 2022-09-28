<template>
  <div class="matching-location infinite-table">
    <vuescroll>
      <table class="w-100">
        <thead>
          <tr>
            <th style="top: 0">Your data</th>
            <th style="top: 0">Matching location</th>
          </tr>
        </thead>
        <tbody>
          <template v-for="(item, index) in unknownLocations">
            <tr v-bind:key="index" :class="cellClassAt(index)">
              <td class="single-line w-50">{{ item.name }}</td>
              <td class="matching-cell">
                <DiDropdown
                  :id="genDropdownId(`match-${item.name}`)"
                  :appendAtRoot="true"
                  :data="matchingOptions"
                  :value="currentGeoCodeOfLocation(item)"
                  boundary="scrollParent"
                  class="dropdown-matching"
                  labelProps="displayName"
                  valueProps="id"
                  @selected="selectGeoLocation(item, ...arguments)"
                >
                  <template #icon-dropdown>
                    <b-icon-caret-down-fill class="ic-16" style="color: var(--secondary-text-color)" />
                  </template>
                </DiDropdown>
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </vuescroll>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import { MapItem } from '@core/domain/Response';
import { GeolocationModule } from '@/store/modules/data_builder/geolocation.store';
import { SelectOption } from '@/shared';
import VueContext from 'vue-context';
import DataListing from '@/screens/DashboardDetail/components/WidgetContainer/charts/ActionWidget/DataListing.vue';
import { ChartInfo, MapChartChartOption } from '@core/domain';
import { Log } from '@core/utils';
import { _ThemeStore } from '@/store/modules/ThemeStore';

@Component({ components: { DataListing, VueContext } })
export default class LocationNormalizeTable extends Vue {
  @Prop({ required: true, type: Array })
  unknownLocations!: MapItem[];

  @Prop({ required: true, type: Array })
  normalizedLocation!: MapItem[];

  @Prop({ required: false, type: Object })
  currentChartInfo?: ChartInfo;
  private get matchingOptions(): SelectOption[] {
    const chartOptions: MapChartChartOption = this.currentChartInfo?.setting.getChartOption() as MapChartChartOption;
    const area: string | undefined = chartOptions?.options?.geoArea;
    const defaultOption = {
      id: 'unknown',
      displayName: 'Unknown'
    };
    const locationToMatching = this.getLocationsOf(area);
    return [defaultOption, ...locationToMatching];
  }

  private getLocationsOf(area?: string): SelectOption[] {
    const locationMatched = new Set(this.normalizedLocation.filter(item => !!item.value).map(item => item.code));
    Log.debug('matchingOptions:: Area: ', GeolocationModule.geolocationAsMap);
    return (
      GeolocationModule.geolocationAsMap
        .get(area ?? '')
        ?.filter(location => !locationMatched.has(location.code))
        ?.map(location => ({
          displayName: location.name,
          id: location.code
        })) ?? []
    );
  }

  private cellClassAt(index: number): string {
    return index % 2 == 0 ? 'even matching-cell' : 'odd matching-cell';
  }

  private currentGeoCodeOfLocation(location: MapItem): string {
    return GeolocationModule.locationMatchedAsMap.get(location.name) ?? 'unknown';
  }

  private selectGeoLocation(locationToMatching: MapItem, geoLocationSelected: SelectOption) {
    const selectedGeolocation: string | undefined = geoLocationSelected.id as string;
    if (selectedGeolocation) {
      GeolocationModule.updateLocationMatching({ key: locationToMatching.name, value: selectedGeolocation });
      this.$forceUpdate();
    }
  }
}
</script>

<style lang="scss" scoped>
@import 'src/shared/components/charts/CustomTable/table.scss';
//.matching-location {
//  --table-header-color: white;
//}
.matching-location {
  --header-background-color: var(--matching-header-color);
}

::v-deep td.matching-cell {
  max-width: 10vw;
  padding: 0;

  .dropdown-matching button {
    background-color: transparent !important;
    padding: 0;

    input::placeholder {
      color: var(--secondary-text-color);
    }
  }
}
</style>
