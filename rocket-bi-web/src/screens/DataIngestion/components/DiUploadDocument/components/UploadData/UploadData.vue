<template>
  <div>
    <div v-if="backgroundRunning" class="upload-data-minimize">
      <a @click.prevent="maximize" href="#">
        <span v-if="value.chunkContainer.success">Upload success</span>
        <span v-else-if="value.chunkContainer.fail">Upload failed</span>
        <span v-else> Uploading... ({{ value.chunkContainer.loadingPercentStr }}) </span>
      </a>
    </div>
    <Modal ref="modal" hide-footer backdrop="static" :keyboard="false" :width="610">
      <template slot="header-action">
        <button @click.prevent="minimize" aria-label="Close" class="close minimize" type="button">
          <span aria-hidden="true">-</span>
        </button>
        <button @click.prevent="close" aria-label="Close" class="close" type="button">
          <span aria-hidden="true">&times;</span>
        </button>
      </template>
      <template slot="header">
        <div v-if="value && value.chunkContainer" class="w-100">
          <h5 class="modal-title text-left">{{ value.title }}</h5>
          <div class="modal-desc">
            <span v-if="value.chunkContainer.success" class="text-success">Success</span>
            <span v-else-if="value.chunkContainer.fail" class="text-danger">Failed</span>
            <span v-else>{{ value.desc }}</span>
          </div>
        </div>
      </template>
      <div v-if="value && value.chunkContainer && value.files[0]" class="my-4">
        <div class="d-flex justify-content-between mb-2">
          <span>
            <img src="../../assets/icons/csv.svg" alt="" width="16" height="16" />
            {{ value.files[0].name }}
          </span>
          <span>{{ value.chunkContainer.loadingPercentStr }}</span>
        </div>
        <div class="progress progress-di">
          <div class="progress-bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" :style="{ width: value.chunkContainer.loadingPercentStr }"></div>
        </div>
        <div v-if="value.chunkContainer.success" class="mt-4">
          <div class="text-center">
            <button @click.prevent="handleUploadSuccess" class="btn btn-di-primary">View data</button>
          </div>
        </div>
        <template v-if="isStopped && value.chunkContainer.failItems.length > 0">
          <div class="mt-2">
            <p class="text-muted">
              <small>Error when uploading file!</small>
            </p>
            <div class="text-center">
              <button :disabled="loading" @click.prevent="reUpload" class="btn btn-di-primary">Re Upload</button>
            </div>
          </div>
        </template>
        <a href="#di-uld-detail" data-toggle="collapse" class="color-di-primary dropdown-toggle w-auto mt-3">
          <small>View details ({{ detailChunkItems.length }} / {{ value.chunkContainer.total }} chunks)</small>
        </a>
        <div ref="detail" @scroll="onScrollDetail" id="di-uld-detail" class="collapse mt-2 upload-data-chunk-detail overflow-auto">
          <div v-for="item in detailChunkItems" :key="item.index">
            <span>{{ item.name }} ({{ item.totalLines }} records) - </span>
            <span v-if="item.error" class="text-danger">Fail ({{ item.error }})</span>
            <span v-else-if="item.loading" class="text-muted">Uploading...</span>
            <span v-else class="text-success">Success</span>
          </div>
          <!--          <table class="table table-striped mb-0 table-sm">-->
          <!--            <tbody>-->
          <!--              <tr v-for="item in value.chunkContainer.failItems" :key="item.index">-->
          <!--                <td class="">-->
          <!--                  {{ item.name }} ({{ item.totalLines }} rows)-->
          <!--                  <p v-if="item.error" class="text-danger mb-0">-->
          <!--                    {{ item.error }}-->
          <!--                  </p>-->
          <!--                </td>-->
          <!--                &lt;!&ndash;                  <td>&ndash;&gt;-->
          <!--                &lt;!&ndash;                    <div v-if="item.loading || item.success" class="progress progress-di">&ndash;&gt;-->
          <!--                &lt;!&ndash;                      <div class="progress-bar" role="progressbar"&ndash;&gt;-->
          <!--                &lt;!&ndash;                           aria-valuemin="0" aria-valuemax="100"&ndash;&gt;-->
          <!--                &lt;!&ndash;                           :style="{width: item.loadingPercentStr}">&ndash;&gt;-->
          <!--                &lt;!&ndash;                      </div>&ndash;&gt;-->
          <!--                &lt;!&ndash;                    </div>&ndash;&gt;-->
          <!--                &lt;!&ndash;                  </td>&ndash;&gt;-->
          <!--                &lt;!&ndash;                  <td class="text-right" style="width: 40px">&ndash;&gt;-->
          <!--                &lt;!&ndash;                    <strong v-if="item.success">DONE</strong>&ndash;&gt;-->
          <!--                &lt;!&ndash;                    <strong v-else-if="item.error">ERROR</strong>&ndash;&gt;-->
          <!--                &lt;!&ndash;                    <span v-else-if="item.loading">{{ item.loadingPercentStr }}</span>&ndash;&gt;-->
          <!--                &lt;!&ndash;                    <span v-else>&#45;&#45;</span>&ndash;&gt;-->
          <!--                &lt;!&ndash;                  </td>&ndash;&gt;-->
          <!--              </tr>-->
          <!--            </tbody>-->
          <!--          </table>-->
        </div>
        <!--        <div v-if="value.chunkContainer.failItems.length > 0" class="mt-3">-->
        <!--          <a href="#di-uld-detail" data-toggle="collapse" class="color-di-primary dropdown-toggle w-auto">-->
        <!--            View details ({{ value.chunkContainer.failItems.length }} fail chunks)-->
        <!--          </a>-->
        <!--          <div id="di-uld-detail" class="collapse table-container mt-2" style="max-height: 300px">-->
        <!--            <table class="table table-striped mb-0 table-sm">-->
        <!--              <tbody>-->
        <!--                <tr v-for="item in value.chunkContainer.failItems" :key="item.index">-->
        <!--                  <td class="">-->
        <!--                    {{ item.name }} ({{ item.totalLines }} rows)-->
        <!--                    <p v-if="item.error" class="text-danger mb-0">-->
        <!--                      {{ item.error }}-->
        <!--                    </p>-->
        <!--                  </td>-->
        <!--                  &lt;!&ndash;                  <td>&ndash;&gt;-->
        <!--                  &lt;!&ndash;                    <div v-if="item.loading || item.success" class="progress progress-di">&ndash;&gt;-->
        <!--                  &lt;!&ndash;                      <div class="progress-bar" role="progressbar"&ndash;&gt;-->
        <!--                  &lt;!&ndash;                           aria-valuemin="0" aria-valuemax="100"&ndash;&gt;-->
        <!--                  &lt;!&ndash;                           :style="{width: item.loadingPercentStr}">&ndash;&gt;-->
        <!--                  &lt;!&ndash;                      </div>&ndash;&gt;-->
        <!--                  &lt;!&ndash;                    </div>&ndash;&gt;-->
        <!--                  &lt;!&ndash;                  </td>&ndash;&gt;-->
        <!--                  &lt;!&ndash;                  <td class="text-right" style="width: 40px">&ndash;&gt;-->
        <!--                  &lt;!&ndash;                    <strong v-if="item.success">DONE</strong>&ndash;&gt;-->
        <!--                  &lt;!&ndash;                    <strong v-else-if="item.error">ERROR</strong>&ndash;&gt;-->
        <!--                  &lt;!&ndash;                    <span v-else-if="item.loading">{{ item.loadingPercentStr }}</span>&ndash;&gt;-->
        <!--                  &lt;!&ndash;                    <span v-else>&#45;&#45;</span>&ndash;&gt;-->
        <!--                  &lt;!&ndash;                  </td>&ndash;&gt;-->
        <!--                </tr>-->
        <!--              </tbody>-->
        <!--            </table>-->
        <!--          </div>-->
        <!--        </div>-->
      </div>
    </Modal>
  </div>
</template>
<script src="./UploadData.ctrl.js"></script>
<style>
.upload-data-chunk-detail {
  font-size: 12px;
  max-height: 300px;
  /*overflow: auto;*/
  /*display: flex;*/
  /*flex-direction: column-reverse;*/
}
.upload-data-chunk-detail > div {
  background-color: var(--active-color);
  padding: 2px 4px;
}
.upload-data-chunk-detail > div:nth-child(2n + 1) {
  background-color: var(--hover-color);
}
</style>
