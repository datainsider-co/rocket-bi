<template>
  <div>
    <div class="row">
      <div class="col-12 col-sm-7 col-lg-8">
        <div v-if="!!error" class="d-flex flex-column justify-content-center align-items-center text-center" style="height: 400px">
          <h6 class="text-danger">Error when calculate preview data!</h6>
          <p class="text-muted">{{ error }}</p>
          <button @click.prevent="calcPreviewData" class="btn btn-di-primary">Retry</button>
        </div>
        <div v-else-if="loading" class="d-flex flex-column justify-content-center align-items-center text-center" style="height: 400px">
          <p class="text-muted">Calculate preview data...</p>
        </div>
        <div v-else class="table-container" style="height: 400px">
          <vuescroll>
            <table class="table table-striped mb-0">
              <thead>
                <tr>
                  <th class="text-center">Name</th>
                  <th v-for="header in value.schema.columns" :key="header.key">
                    <span v-if="value.setting.include_header">{{ header.display_name }}</span>
                    <input :id="genInputId('column-name')" v-else v-model="header.display_name" type="text" class="bg-transparent border-0" />
                  </th>
                </tr>
                <tr>
                  <th class="text-center">Type</th>
                  <th v-for="column in value.schema.columns" :key="column.name">
                    <div class="dropdown dropdown-th">
                      <a href="#" class="font-weight-normal dropdown-toggle" data-toggle="dropdown">{{ COLUMN_DATA_TYPE_NAME[column.class_name] }}</a>
                      <div class="dropdown-menu">
                        <a @click.prevent="changeColumnClassName(column, item)" v-for="item in classNames" :key="item.id" href="#" class="dropdown-item">
                          {{ item.name }}
                        </a>
                      </div>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(item, idx) in records" :key="idx">
                  <td class="text-center">{{ idx + 1 }}</td>
                  <td v-for="(column, hIdx) in value.schema.columns" :key="hIdx">{{ item[hIdx] }}</td>
                </tr>
              </tbody>
            </table>
          </vuescroll>
        </div>
      </div>
      <div class="col-12 col-sm-5 col-lg-4 text-left">
        <div class="form-group form-group-di">
          <label>Column Headers</label>
          <div class="d-flex align-items-center mb-3">
            <label class="di-radio">
              <input
                :id="genCheckboxId('use-first-row-headers')"
                v-model="value.setting.include_header"
                @change="calcPreviewData(false)"
                :value="true"
                type="radio"
                name="header"
              />
              <span></span>
              <span>Use first row as headers</span>
            </label>
            <i class="ml-auto">
              <img src="../../../DiUploadDocument/assets/icons/question.svg" alt="" width="16" height="16" />
            </i>
          </div>
          <div class="d-flex align-items-center">
            <label class="di-radio">
              <input
                :id="genCheckboxId('generate-headers')"
                v-model="value.setting.include_header"
                @change="calcPreviewData(false)"
                :value="false"
                type="radio"
                name="header"
              />
              <span></span>
              <span>Generate headers</span>
            </label>
            <i class="ml-auto">
              <img src="../../../DiUploadDocument/assets/icons/question.svg" alt="" width="16" height="16" />
            </i>
          </div>
        </div>
        <!--        <div class="form-group form-group-di">-->
        <!--          <label>Delimiter</label>-->
        <!--          <div class="d-flex align-items-center">-->
        <!--            <div class="dropdown">-->
        <!--              <a href="#" class="btn btn-di-default w-auto dropdown-toggle" data-toggle="dropdown">-->
        <!--                {{ value.setting.delimiter === '\t' ? '\\t' : value.setting.delimiter }}-->
        <!--              </a>-->
        <!--              <div class="dropdown-menu">-->
        <!--                <a @click.prevent="changeDelimiter(item)" v-for="item in delimiters" :key="item" href="#" class="dropdown-item"-->
        <!--                  ><code>{{ item === '\t' ? '\\t' : item }}</code></a-->
        <!--                >-->
        <!--              </div>-->
        <!--            </div>-->
        <!--            <i class="ml-auto">-->
        <!--              <img src="../../../DiUploadDocument/assets/icons/question.svg" alt="" width="16" height="16" />-->
        <!--            </i>-->
        <!--          </div>-->
        <!--        </div>-->
      </div>
    </div>
    <div class="d-flex mt-5 align-items-center">
      <span class="text-muted">Previewing first {{ records.length }} rows</span>
      <div class="ml-auto">
        <button @click.prevent="back" class="btn btn-secondary mr-3">Back</button>
        <button :disabled="!canNext" @click.prevent="next" class="btn btn-di-primary">Next</button>
      </div>
    </div>
  </div>
</template>
<script src="./PreviewGoogleSheet.ctrl.js"></script>
