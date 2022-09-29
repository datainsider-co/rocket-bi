<template>
  <div v-if="isError" class="cdp-body-content-block-nodata">
    <ErrorWidget :error="errorMsg" @onRetry="retryFunction"></ErrorWidget>
  </div>
  <div v-else-if="isEmpty" class="cdp-body-content-block-nodata">
    <i class="cdp-body-content-block-nodata-icon di-icon-web-analysis"></i>
    <div class="cdp-body-content-block-nodata-msg text-center">
      Select an Event to get started
    </div>
  </div>
  <div v-else class="event-explorer-result" :style="cssVariables" @mousewheel="handleMouseWheel">
    <vuescroll>
      <div class="event-explorer-result-body">
        <DiagramPanel ref="diagramPanel" class="eer-connections" no-scroll no-draggable no-control>
          <EventConnection
            ref="eventConnections"
            v-for="(connection, idx) in connections"
            :key="idx"
            :from-id="connection.from"
            :to-id="connection.to"
            :options="connection.options"
          >
          </EventConnection>
        </DiagramPanel>
        <div v-for="(step, idx) in [result.step]" :key="step.id" class="eer-item">
          <div class="eer-item-add-steps">
            <PopoverV2 class="dropdown" auto-hide>
              <button class="btn p-0 eer-btn-explore-event">
                <i class="di-icon-add btn-icon-border p-1"></i>
              </button>
              <template #menu>
                <div class="dropdown-menu">
                  <a @click.prevent="addSubStepBefore(step, 1)" class="dropdown-item" href="#">Explore 1 event</a>
                  <a @click.prevent="addSubStepBefore(step, 2)" class="dropdown-item" href="#">Explore 2 events</a>
                  <a @click.prevent="addSubStepBefore(step, 3)" class="dropdown-item" href="#">Explore 3 events</a>
                </div>
              </template>
            </PopoverV2>
          </div>
          <div v-for="(subStep, subStepIdx) in step.beforeSteps" :key="subStep.id" class="eer-item-step">
            <a
              @click.prevent="removeBeforeStep(step)"
              @mouseover="setRemovalBeforeStep(step, subStepIdx, true)"
              @mouseout="setRemovalBeforeStep(step, subStepIdx, false)"
              :class="{ 'can-remove': isRemovalBeforeStep(step, subStepIdx) }"
              href="#"
              class="eer-item-step-name"
            >
              <div class="eer-item-step-name-text">
                <span class="eer-text">{{ idx + 1 }} - {{ step.beforeSteps.length - subStepIdx }}</span>
                <span class="eer-action"> Remove {{ removalBeforeSteps.length > 1 ? 'steps' : 'step' }} </span>
              </div>
              <span v-if="subStepIdx > 0" class="eer-item-step-name-arrow-left"></span>
              <span class="eer-item-step-name-arrow-right"></span>
            </a>
            <div v-if="subStep.isLoading" class="eer-item-step-event" v-loading="subStep.isLoading">
              <div class="font-weight-semi-bold">
                Loading events
              </div>
              <div>
                Loading values
              </div>
              <div class="eer-item-step-event-value eer-loading"></div>
            </div>
            <template v-else>
              <div v-for="event in mergeDuplicateStep(subStep.events)" :key="event.id" class="eer-item-step-event">
                <div class="font-weight-semi-bold">{{ event.eventName }}</div>
                <div>{{ event.value.percent | format }}% - {{ event.value.count | format }}</div>
                <div
                  class="eer-item-step-event-value"
                  :id="event.id"
                  :style="{ ...getStyleFromPercent(event.value.percent), ...getColorFromEventName(event.eventName) }"
                >
                  <!--            <div class="eer-item-step-event-value-flow" :style="getStyleFromPercent(event.value.percent)" style="width: 100%"></div>-->
                </div>
              </div>
              <div v-if="subStep.other && subStep.other.count > 0" :key="`other-${subStep.orderId}`" class="eer-item-step-event">
                <div class="font-weight-semi-bold">Others</div>
                <div>{{ subStep.other.percent | format }}% - {{ subStep.other.count | format }}</div>
                <div
                  class="eer-item-step-event-value"
                  :id="subStep.orderId"
                  :style="{ ...getStyleFromPercent(subStep.other.percent), ...getColorFromEventName(subStep.other.name) }"
                ></div>
              </div>
              <!--              <div v-if="subStep.dropOff && subStep.dropOff.count > 0" :key="`drop-off-${subStep.dropOffId}`" class="eer-item-step-event">-->
              <!--                <div class="font-weight-semi-bold">Others</div>-->
              <!--                <div>{{ subStep.dropOff.percent | format }}% - {{ subStep.dropOff.count | format }}</div>-->
              <!--                <div class="eer-item-step-event-value dropoff" :id="subStep.dropOffId" :style="getStyleFromPercent(subStep.dropOff.percent)"></div>-->
              <!--              </div>-->
            </template>
          </div>
          <div class="eer-item-step eer-item-main-step">
            <div class="eer-item-step-name">
              <div class="eer-item-step-name-text">
                <span class="mr-2">{{ idx + 1 }}</span>
                <span class="font-weight-semi-bold">{{ step.eventName }}</span>
              </div>
              <span v-if="idx > 0 || step.beforeSteps.length > 0" class="eer-item-step-name-arrow-left"></span>
              <span class="eer-item-step-name-arrow-right"></span>
            </div>
            <div v-if="step.isLoading" class="eer-item-step-event" key="main-event" v-loading="step.isLoading">
              <div class="font-weight-semi-bold">
                {{ step.eventName }}
              </div>
              <div>
                Loading values
              </div>
              <div class="eer-item-step-event-value eer-loading">
                <div class="d-flex w-100 h-100"></div>
              </div>
            </div>
            <template v-else>
              <div class="eer-item-step-event">
                <div class="font-weight-semi-bold">{{ step.eventName }}</div>
                <div>{{ step.total.percent | format }}% - {{ step.total.count | format }}</div>
                <div
                  class="eer-item-step-event-value"
                  :id="step.id"
                  :style="{ ...getStyleFromPercent(step.total.percent), ...getColorFromEventName(step.eventName) }"
                ></div>
              </div>
              <!--              <div v-if="step.dropOff" class="eer-item-step-event">-->
              <!--                <div class="font-weight-semi-bold">Drop-off</div>-->
              <!--                <div>{{ step.dropOff.percent | format }}% - {{ step.dropOff.count | format }}</div>-->
              <!--                <div class="eer-item-step-event-value dropoff" :id="connector.getDropOffId(step)" :style="getStyleFromPercent(step.dropOff.percent)"></div>-->
              <!--              </div>-->
            </template>
          </div>
          <div v-for="(subStep, subStepIdx) in step.afterSteps" :key="subStep.id" class="eer-item-step">
            <a
              @click.prevent="removeAfterStep(step)"
              @mouseover="setRemovalAfterStep(step, subStepIdx, true)"
              @mouseout="setRemovalAfterStep(step, subStepIdx, false)"
              :class="{ 'can-remove': isRemovalAfterStep(step, subStepIdx) }"
              href="#"
              class="eer-item-step-name"
            >
              <div class="eer-item-step-name-text">
                <span class="eer-text">{{ idx + 1 }} + {{ subStepIdx + 1 }}</span>
                <span class="eer-action"> Remove {{ removalAfterSteps.length > 1 ? 'steps' : 'step' }} </span>
              </div>
              <span class="eer-item-step-name-arrow-left"></span>
              <span class="eer-item-step-name-arrow-right"></span>
            </a>
            <div v-if="subStep.isLoading" class="eer-item-step-event" v-loading="subStep.isLoading">
              <div class="font-weight-semi-bold">
                Loading events
              </div>
              <div>
                Loading values
              </div>
              <div class="eer-item-step-event-value eer-loading"></div>
            </div>
            <template v-else>
              <div v-for="event in mergeDuplicateStep(subStep.events)" :key="event.id" class="eer-item-step-event">
                <div class="font-weight-semi-bold">{{ event.eventName }}</div>
                <div>{{ event.value.percent | format }}% - {{ event.value.count | format }}</div>
                <div
                  class="eer-item-step-event-value"
                  :id="event.id"
                  :style="{ ...getStyleFromPercent(event.value.percent), ...getColorFromEventName(event.eventName) }"
                ></div>
              </div>

              <div v-if="subStep.other && subStep.other.count > 0" :key="`other-${subStep.id}`" class="eer-item-step-event">
                <div class="font-weight-semi-bold">Others</div>
                <div>{{ subStep.other.percent | format }}% - {{ subStep.other.count | format }}</div>
                <div
                  class="eer-item-step-event-value"
                  :id="subStep.orderId"
                  :style="{ ...getStyleFromPercent(subStep.other.percent), ...getColorFromEventName('') }"
                ></div>
              </div>
              <!--              <div v-if="subStep.dropOff && subStep.dropOff.count > 0" :key="`drop-off-${subStep.dropOffId}`" class="eer-item-step-event">-->
              <!--                <div class="font-weight-semi-bold">Drop-off</div>-->
              <!--                <div>{{ subStep.dropOff.percent | format }}% - {{ subStep.dropOff.count | format }}</div>-->
              <!--                <div class="eer-item-step-event-value dropoff" :id="subStep.dropOffId" :style="getStyleFromPercent(subStep.dropOff.percent)"></div>-->
              <!--              </div>-->
            </template>
          </div>
          <div class="eer-item-add-steps">
            <PopoverV2 class="dropdown" auto-hide>
              <button class="btn p-0 eer-btn-explore-event">
                <i class="di-icon-add btn-icon-border p-1"></i>
              </button>
              <template #menu>
                <div class="dropdown-menu">
                  <a @click.prevent="addSubStepAfter(step, 1)" class="dropdown-item" href="#">Explore 1 event</a>
                  <a @click.prevent="addSubStepAfter(step, 2)" class="dropdown-item" href="#">Explore 2 events</a>
                  <a @click.prevent="addSubStepAfter(step, 3)" class="dropdown-item" href="#">Explore 3 events</a>
                </div>
              </template>
            </PopoverV2>
          </div>
        </div>
      </div>
    </vuescroll>
  </div>
</template>
<script lang="ts" src="./EventExplorerResult.ts"></script>
<style lang="scss" src="./EventExplorerResult.scss" scoped></style>
