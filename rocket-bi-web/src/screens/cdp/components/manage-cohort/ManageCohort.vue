<template>
  <DiModal ref="modal" @hidden="resetModel" :width="1140" :title="title">
    <template v-if="model">
      <vuescroll ref="vueScroll" style="position:unset">
        <div style="max-height: 70vh">
          <div class="form-group text-left">
            <label>Cohort Name</label>
            <input
              :id="genInputId('cohort-name')"
              :disabled="loading"
              v-model="model.name"
              type="text"
              class="form-control"
              placeholder="Cohort Name"
              autofocus
            />
          </div>
          <div class="form-group text-left">
            <label>Description</label>
            <textarea
              :id="genInputId('cohort-description')"
              :disabled="loading"
              v-model="model.description"
              style="resize: none"
              rows="6"
              type="text"
              class="form-control"
              placeholder="Description"
            />
          </div>
          <div class="form-group">
            <div class="text-muted text-left font-weight-bold py-2">ALL USER</div>
            <CohortFilterComponent :disabled="loading" v-model="model.extraData.filterGroup" hide-save-actions @addGroup="onAddGroup"></CohortFilterComponent>
          </div>
        </div>
      </vuescroll>
    </template>
    <template #footer class="text-right">
      <div class="text-danger">
        {{ error }}
      </div>
      <button :disabled="loading" @click.prevent="saveCohort" id="save-cohort" class="btn btn-primary btn-di ml-auto">
        {{ loading ? 'Processing' : 'Save' }}
      </button>
    </template>
  </DiModal>
</template>
<script lang="ts" src="./ManageCohort.ts"></script>
