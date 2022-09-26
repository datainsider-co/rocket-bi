<template>
  <div class="google-sheet-selection-form">
    <div class="row">
      <div class="col-12">
        <div class="describe-db mx-auto">
          <div :class="{ 'pe-none': spreadsheetLoading }" class="form-group position-relative">
            <label>Select spreadsheet</label>
            <DiDropdown
              id="spreadsheet-selection"
              v-model="value.spreadsheetId"
              :data="listSpreadSheet"
              label-props="name"
              value-props="id"
              :disabled="isError || spreadsheetLoading"
              @selected="handleSpreadSheetChange"
            >
              <template slot="icon-dropdown">
                <i v-if="spreadsheetLoading" alt="dropdown" class="fa fa-spin fa-spinner text-muted"></i>
                <i v-else alt="dropdown" class="di-icon-arrow-down text-muted"></i>
              </template>
            </DiDropdown>
          </div>
          <div :class="{ 'pe-none': sheetLoading }" class="form-group position-relative mb-0">
            <label>Select sheet</label>
            <DiDropdown
              id="sheet-selection"
              v-model="value.sheetId"
              :data="listSheet"
              label-props="title"
              value-props="sheetId"
              :disabled="isError || sheetLoading"
              @selected="onChangeSheetTitle"
            ></DiDropdown>
            <div v-if="sheetLoading" class="loading d-flex align-items-center position-absolute">
              <i class="fa fa-spin fa-spinner"></i>
            </div>
          </div>
        </div>
        <div v-if="error" class="error-message text-danger mt-2">{{ error }}</div>
      </div>
    </div>
    <div class="row mt-3">
      <div class="col-12 text-right">
        <button :disabled="sheetLoading || sheetLoading || isError" class="btn btn-di-primary" @click.prevent="next">Next</button>
      </div>
    </div>
  </div>
</template>
<script src="./GoogleSheetSelectionForm.ctrl.js"></script>
<style lang="scss">
.google-sheet-selection-form {
  .describe-db {
    .form-group {
      label {
        margin-bottom: 12px;
      }
    }

    .select-container {
      margin-top: 0;
    }
    #spreadsheet-selection,
    #sheet-selection {
      height: 34px;
    }
  }

  .error-message {
    font-size: 14px !important;
  }
}
</style>
